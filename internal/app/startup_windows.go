//go:build windows

package app

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"golang.org/x/sys/windows/registry"
)

const startupBackupPath = `Software\Highgarden\StartupDisabled`

type startupRun struct {
	scope string
	root  registry.Key
	path  string
	label string
}

var startupRuns = []startupRun{
	{"user", registry.CURRENT_USER, `Software\Microsoft\Windows\CurrentVersion\Run`, "HKCU Run"},
	{"machine", registry.LOCAL_MACHINE, `SOFTWARE\Microsoft\Windows\CurrentVersion\Run`, "HKLM Run"},
	{"machine", registry.LOCAL_MACHINE, `SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Run`, "HKLM Run (32-bit)"},
}

type startupID struct {
	Scope string `json:"s"`
	Kind  string `json:"k"`
	Path  string `json:"p"`
	Name  string `json:"n"`
}

func encodeStartupID(id startupID) string {
	data, _ := json.Marshal(id)
	return base64.RawURLEncoding.EncodeToString(data)
}

func decodeStartupID(value string) (startupID, error) {
	data, err := base64.RawURLEncoding.DecodeString(value)
	if err != nil {
		return startupID{}, errors.New("invalid startup entry")
	}
	var id startupID
	if err := json.Unmarshal(data, &id); err != nil {
		return startupID{}, errors.New("invalid startup entry")
	}
	return id, nil
}

func startupFolder(scope string) string {
	if scope == "machine" {
		return filepath.Join(os.Getenv("ProgramData"), `Microsoft\Windows\Start Menu\Programs\Startup`)
	}
	return filepath.Join(os.Getenv("APPDATA"), `Microsoft\Windows\Start Menu\Programs\Startup`)
}

func startupHive(scope string) registry.Key {
	if scope == "machine" {
		return registry.LOCAL_MACHINE
	}
	return registry.CURRENT_USER
}

func findStartupRun(scope, path string) (startupRun, bool) {
	for _, run := range startupRuns {
		if run.scope == scope && run.path == path {
			return run, true
		}
	}
	return startupRun{}, false
}

func disabledValueName(path, name string) string {
	return base64.RawURLEncoding.EncodeToString([]byte(path + "\x00" + name))
}

func decodeDisabledValueName(value string) (path, name string, ok bool) {
	data, err := base64.RawURLEncoding.DecodeString(value)
	if err != nil {
		return "", "", false
	}
	parts := strings.SplitN(string(data), "\x00", 2)
	if len(parts) != 2 {
		return "", "", false
	}
	return parts[0], parts[1], true
}

func listStartup() ([]StartupItem, error) {
	items := make([]StartupItem, 0, 16)

	for _, run := range startupRuns {
		key, err := registry.OpenKey(run.root, run.path, registry.READ)
		if err != nil {
			continue
		}
		names, err := key.ReadValueNames(-1)
		if err != nil {
			key.Close()
			continue
		}
		for _, name := range names {
			value, valueType, err := key.GetStringValue(name)
			if err != nil || (valueType != registry.SZ && valueType != registry.EXPAND_SZ) {
				continue
			}
			if strings.TrimSpace(value) == "" {
				continue
			}
			items = append(items, StartupItem{
				ID:         encodeStartupID(startupID{Scope: run.scope, Kind: "run", Path: run.path, Name: name}),
				Name:       name,
				Command:    value,
				Location:   run.label,
				Scope:      run.scope,
				Enabled:    true,
				CanToggle:  true,
				NeedsAdmin: run.scope == "machine",
			})
		}
		key.Close()
	}

	// Entries this app disabled, kept in a key of its own.
	for _, scope := range []string{"user", "machine"} {
		backup, err := registry.OpenKey(startupHive(scope), startupBackupPath, registry.READ)
		if err != nil {
			continue
		}
		names, _ := backup.ReadValueNames(-1)
		for _, encoded := range names {
			path, name, ok := decodeDisabledValueName(encoded)
			if !ok {
				continue
			}
			run, ok := findStartupRun(scope, path)
			if !ok {
				continue
			}
			value, _, err := backup.GetStringValue(encoded)
			if err != nil || strings.TrimSpace(value) == "" {
				continue
			}
			items = append(items, StartupItem{
				ID:         encodeStartupID(startupID{Scope: scope, Kind: "run", Path: path, Name: name}),
				Name:       name,
				Command:    value,
				Location:   run.label,
				Scope:      scope,
				Enabled:    false,
				CanToggle:  true,
				NeedsAdmin: scope == "machine",
			})
		}
		backup.Close()
	}

	for _, scope := range []string{"user", "machine"} {
		folder := startupFolder(scope)
		entries, err := os.ReadDir(folder)
		if err != nil {
			continue
		}
		for _, entry := range entries {
			if entry.IsDir() || strings.EqualFold(entry.Name(), "desktop.ini") {
				continue
			}
			full := filepath.Join(folder, entry.Name())
			enabled := !strings.HasSuffix(strings.ToLower(entry.Name()), ".disabled")
			logical := full
			name := entry.Name()
			if !enabled {
				logical = strings.TrimSuffix(full, ".disabled")
				name = strings.TrimSuffix(entry.Name(), ".disabled")
			}
			items = append(items, StartupItem{
				ID:         encodeStartupID(startupID{Scope: scope, Kind: "folder", Path: logical, Name: name}),
				Name:       name,
				Command:    logical,
				Location:   "Startup folder (" + scope + ")",
				Scope:      scope,
				Enabled:    enabled,
				CanToggle:  true,
				NeedsAdmin: scope == "machine",
			})
		}
	}

	sort.Slice(items, func(i, j int) bool {
		if items[i].Scope != items[j].Scope {
			return items[i].Scope < items[j].Scope
		}
		return strings.ToLower(items[i].Name) < strings.ToLower(items[j].Name)
	})
	return items, nil
}

func setStartupEnabled(id string, enabled bool) error {
	entry, err := decodeStartupID(id)
	if err != nil {
		return err
	}
	switch entry.Kind {
	case "run":
		return setRunEnabled(entry, enabled)
	case "folder":
		return setFolderEnabled(entry, enabled)
	default:
		return fmt.Errorf("unknown startup entry kind %q", entry.Kind)
	}
}

func setRunEnabled(entry startupID, enabled bool) error {
	run, ok := findStartupRun(entry.Scope, entry.Path)
	if !ok {
		return errors.New("that startup entry is not one this app may change")
	}
	backupPathKey := disabledValueName(entry.Path, entry.Name)

	if !enabled {
		key, err := registry.OpenKey(run.root, run.path, registry.READ|registry.SET_VALUE)
		if err != nil {
			return err
		}
		defer key.Close()
		value, valueType, err := key.GetStringValue(entry.Name)
		if err != nil {
			return fmt.Errorf("%s is no longer in %s: %w", entry.Name, run.label, err)
		}
		backup, _, err := registry.CreateKey(run.root, startupBackupPath, registry.QUERY_VALUE|registry.SET_VALUE|registry.ENUMERATE_SUB_KEYS)
		if err != nil {
			return err // usually access denied without administrator rights
		}
		defer backup.Close()
		switch valueType {
		case registry.SZ:
			err = backup.SetStringValue(backupPathKey, value)
		case registry.EXPAND_SZ:
			err = backup.SetExpandStringValue(backupPathKey, value)
		default:
			return fmt.Errorf("%s is not a text startup value", entry.Name)
		}
		if err != nil {
			return err
		}
		if err := key.DeleteValue(entry.Name); err != nil {
			_ = backup.DeleteValue(backupPathKey)
			return err
		}
		return nil
	}

	backup, err := registry.OpenKey(run.root, startupBackupPath, registry.READ|registry.SET_VALUE|registry.ENUMERATE_SUB_KEYS)
	if err != nil {
		return fmt.Errorf("%s is not disabled by this app", entry.Name)
	}
	defer backup.Close()
	names, err := backup.ReadValueNames(-1)
	if err != nil {
		return err
	}
	encoded := ""
	for _, name := range names {
		path, valueName, ok := decodeDisabledValueName(name)
		if ok && path == entry.Path && valueName == entry.Name {
			encoded = name
			break
		}
	}
	if encoded == "" {
		return fmt.Errorf("%s is not disabled by this app", entry.Name)
	}
	value, valueType, err := backup.GetStringValue(encoded)
	if err != nil {
		return err
	}
	key, _, err := registry.CreateKey(run.root, run.path, registry.QUERY_VALUE|registry.SET_VALUE)
	if err != nil {
		return err
	}
	defer key.Close()
	switch valueType {
	case registry.SZ:
		err = key.SetStringValue(entry.Name, value)
	case registry.EXPAND_SZ:
		err = key.SetExpandStringValue(entry.Name, value)
	default:
		return fmt.Errorf("%s is not a text startup value", entry.Name)
	}
	if err != nil {
		return err
	}
	return backup.DeleteValue(encoded)
}

func setFolderEnabled(entry startupID, enabled bool) error {
	folder := filepath.Clean(startupFolder(entry.Scope))
	path := filepath.Clean(entry.Path)
	if filepath.Dir(path) != folder {
		return errors.New("that startup entry is not in a Startup folder")
	}
	disabled := path + ".disabled"
	if enabled {
		if _, err := os.Stat(path); err == nil {
			return nil // already enabled
		}
		return os.Rename(disabled, path)
	}
	if _, err := os.Stat(disabled); err == nil {
		return fmt.Errorf("%s is already disabled", filepath.Base(path))
	}
	return os.Rename(path, disabled)
}
