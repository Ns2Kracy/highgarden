package app

import (
	"context"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

// CleanTarget is a place the cleaner can empty, with what it measured.
type CleanTarget struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	Detail     string `json:"detail"`
	Path       string `json:"path"`
	Kind       string `json:"kind"` // "folder" or "files"
	Size       int64  `json:"size"`
	Files      int    `json:"files"`
	NeedsAdmin bool   `json:"needsAdmin"`
	Available  bool   `json:"available"`
}

// CleanResult is what a clean freed, and what it could not.
type CleanResult struct {
	Freed   int64    `json:"freed"`
	Files   int      `json:"files"`
	Skipped int      `json:"skipped"`
	Errors  []string `json:"errors"`
}

// Cleaner measures and empties a fixed list of caches. It never deletes
// anywhere else, never follows a symbolic link, and leaves the folders
// themselves in place.
type Cleaner struct{}

type cleanSpec struct {
	id, name, detail, path, pattern string
	needsAdmin                      bool
}

func cleanSpecs() ([]cleanSpec, error) {
	if os.Getenv("SystemRoot") == "" && os.Getenv("LOCALAPPDATA") == "" {
		return nil, errWindowsOnly
	}
	if _, err := os.Stat(os.Getenv("SystemRoot")); err != nil {
		return nil, errWindowsOnly
	}
	root := os.Getenv("SystemRoot")
	local := os.Getenv("LOCALAPPDATA")
	if local == "" {
		local = filepath.Join(os.Getenv("USERPROFILE"), "AppData", "Local")
	}
	return []cleanSpec{
		{
			id: "user-temp", name: "Your temporary files",
			detail: "Files applications left in %TEMP%; open files are skipped.",
			path:   os.TempDir(),
		},
		{
			id: "windows-temp", name: "Windows temporary files",
			detail: "The Windows Temp folder; the system may hold some files open.",
			path:   filepath.Join(root, "Temp"), needsAdmin: true,
		},
		{
			id: "shader-cache", name: "DirectX shader cache",
			detail: "Compiled shaders; games rebuild them on their next launch.",
			path:   filepath.Join(local, "D3DSCache"),
		},
		{
			id: "thumbnails", name: "Explorer thumbnails",
			detail:  "Explorer rebuilds thumbnails as you browse.",
			path:    filepath.Join(local, "Microsoft", "Windows", "Explorer"),
			pattern: "thumbcache_*.db",
		},
		{
			id: "crash-dumps", name: "Crash dumps",
			detail: "Dumps left by applications that failed.",
			path:   filepath.Join(local, "CrashDumps"),
		},
		{
			id: "prefetch", name: "Prefetch data",
			detail: "Windows rebuilds it; the first launches of an app may be slower.",
			path:   filepath.Join(root, "Prefetch"), needsAdmin: true,
		},
	}, nil
}

// Scan measures every target. Sorting and totals happen in the page.
func (Cleaner) Scan(ctx context.Context) ([]CleanTarget, error) {
	specs, err := cleanSpecs()
	if err != nil {
		return nil, err
	}
	targets := make([]CleanTarget, 0, len(specs))
	for _, spec := range specs {
		if err := ctx.Err(); err != nil {
			return targets, err
		}
		target := CleanTarget{
			ID: spec.id, Name: spec.name, Detail: spec.detail,
			Path: spec.path, Kind: "folder",
			NeedsAdmin: spec.needsAdmin,
		}
		if spec.pattern != "" {
			target.Kind = "files"
			matches, _ := filepath.Glob(filepath.Join(spec.path, spec.pattern))
			for _, match := range matches {
				info, err := os.Stat(match)
				if err != nil || info.IsDir() {
					continue
				}
				target.Size += info.Size()
				target.Files++
			}
			target.Available = len(matches) > 0
		} else if info, err := os.Stat(spec.path); err == nil && info.IsDir() {
			target.Available = true
			target.Size, target.Files = measureDir(ctx, spec.path)
		}
		targets = append(targets, target)
	}
	return targets, nil
}

// Clean empties the chosen targets. IDs outside the fixed list are ignored.
func (Cleaner) Clean(ctx context.Context, ids []string) (CleanResult, error) {
	specs, err := cleanSpecs()
	if err != nil {
		return CleanResult{}, err
	}
	byID := make(map[string]cleanSpec, len(specs))
	for _, spec := range specs {
		byID[spec.id] = spec
	}

	var result CleanResult
	for _, id := range ids {
		spec, ok := byID[id]
		if !ok {
			result.Errors = append(result.Errors, fmt.Sprintf("unknown target %q", id))
			continue
		}
		cleanTarget(ctx, spec, &result)
	}
	if len(result.Errors) > 20 {
		result.Errors = result.Errors[:20]
	}
	return result, nil
}

func measureDir(ctx context.Context, root string) (size int64, files int) {
	_ = filepath.WalkDir(root, func(path string, entry fs.DirEntry, err error) error {
		if ctx.Err() != nil {
			return ctx.Err()
		}
		if err != nil {
			return nil
		}
		if path != root && entry.Type()&fs.ModeSymlink != 0 {
			if entry.IsDir() {
				return fs.SkipDir
			}
			return nil
		}
		if entry.IsDir() {
			return nil
		}
		if info, err := entry.Info(); err == nil {
			size += info.Size()
			files++
		}
		return nil
	})
	return size, files
}

func cleanTarget(ctx context.Context, spec cleanSpec, result *CleanResult) {
	root := filepath.Clean(spec.path)

	if spec.pattern != "" {
		matches, _ := filepath.Glob(filepath.Join(spec.path, spec.pattern))
		for _, match := range matches {
			if ctx.Err() != nil {
				return
			}
			if !within(root, match) {
				result.Skipped++
				continue
			}
			removeFile(match, root, result)
		}
		return
	}

	var directories []string
	_ = filepath.WalkDir(root, func(path string, entry fs.DirEntry, err error) error {
		if ctx.Err() != nil {
			return ctx.Err()
		}
		if err != nil {
			result.Errors = append(result.Errors, err.Error())
			return nil
		}
		if path == root {
			return nil
		}
		if entry.Type()&fs.ModeSymlink != 0 {
			result.Skipped++
			if entry.IsDir() {
				return fs.SkipDir
			}
			return nil
		}
		if entry.IsDir() {
			directories = append(directories, path)
			return nil
		}
		removeFile(path, root, result)
		return nil
	})

	// Remove the now-empty folders, deepest first; the target itself stays.
	sort.Slice(directories, func(i, j int) bool { return len(directories[i]) > len(directories[j]) })
	for _, dir := range directories {
		if ctx.Err() != nil {
			return
		}
		if within(root, dir) {
			_ = os.Remove(dir)
		}
	}
}

func removeFile(path, root string, result *CleanResult) {
	if !within(root, path) {
		result.Skipped++
		return
	}
	info, err := os.Lstat(path)
	if err != nil {
		return
	}
	if info.IsDir() || info.Mode()&os.ModeSymlink != 0 {
		result.Skipped++
		return
	}
	if err := os.Remove(path); err != nil {
		result.Errors = append(result.Errors, err.Error())
		return
	}
	result.Freed += info.Size()
	result.Files++
}

// within reports whether target is strictly inside root.
func within(root, target string) bool {
	rel, err := filepath.Rel(filepath.Clean(root), filepath.Clean(target))
	if err != nil || rel == "." || rel == ".." {
		return false
	}
	return !strings.HasPrefix(rel, ".."+string(os.PathSeparator))
}
