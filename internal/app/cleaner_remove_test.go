package app

import (
	"context"
	"os"
	"path/filepath"
	"runtime"
	"testing"
)

func TestCleanTarget(t *testing.T) {
	root := t.TempDir()
	if err := os.WriteFile(filepath.Join(root, "a.txt"), []byte("hello"), 0o600); err != nil {
		t.Fatal(err)
	}
	sub := filepath.Join(root, "sub")
	if err := os.Mkdir(sub, 0o700); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(sub, "b.txt"), []byte("world!"), 0o600); err != nil {
		t.Fatal(err)
	}

	result := CleanResult{}
	cleanTarget(context.Background(), cleanSpec{path: root}, &result)
	if result.Files != 2 {
		t.Fatalf("Files = %d, want 2 (%+v)", result.Files, result)
	}
	if result.Freed != 11 {
		t.Fatalf("Freed = %d, want 11", result.Freed)
	}
	if _, err := os.Stat(filepath.Join(root, "a.txt")); !os.IsNotExist(err) {
		t.Error("a.txt still exists")
	}
	if _, err := os.Stat(sub); !os.IsNotExist(err) {
		t.Error("empty subfolder still exists")
	}
	if _, err := os.Stat(root); err != nil {
		t.Errorf("the target folder itself must stay: %v", err)
	}
}

func TestCleanTargetSkipsSymlinks(t *testing.T) {
	if runtime.GOOS != "windows" {
		t.Skip("the cleaner targets are Windows paths")
	}
	outside := t.TempDir()
	target := filepath.Join(outside, "keep.txt")
	if err := os.WriteFile(target, []byte("keep"), 0o600); err != nil {
		t.Fatal(err)
	}
	root := t.TempDir()
	link := filepath.Join(root, "link.txt")
	if err := os.Symlink(target, link); err != nil {
		t.Skipf("cannot create a symbolic link: %v", err)
	}

	result := CleanResult{}
	cleanTarget(context.Background(), cleanSpec{path: root}, &result)
	if _, err := os.Stat(target); err != nil {
		t.Fatalf("a file outside the root was removed: %v", err)
	}
	if result.Skipped == 0 {
		t.Error("the symbolic link must be counted as skipped")
	}
}
