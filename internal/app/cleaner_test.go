package app

import (
	"context"
	"os"
	"path/filepath"
	"runtime"
	"testing"
)

func TestWithin(t *testing.T) {
	root := filepath.Join(os.TempDir(), "highgarden-root")
	cases := []struct {
		target string
		want   bool
	}{
		{filepath.Join(root, "a.txt"), true},
		{filepath.Join(root, "sub", "a.txt"), true},
		{root, false},
		{filepath.Join(root, "..", "a.txt"), false},
		{filepath.Join(root, "..", "..", "a.txt"), false},
		{filepath.Join(string(filepath.Separator), "Windows", "System32"), false},
	}
	for _, test := range cases {
		if got := within(root, test.target); got != test.want {
			t.Errorf("within(%q) = %v, want %v", test.target, got, test.want)
		}
	}
}

func TestCleanerRefusesUnknownTargets(t *testing.T) {
	if runtime.GOOS != "windows" {
		t.Skip("the cleaner targets are Windows paths")
	}
	result, err := (Cleaner{}).Clean(context.Background(), []string{"../../Windows/System32"})
	if err != nil {
		t.Fatal(err)
	}
	if len(result.Errors) == 0 {
		t.Fatal("an unknown target must be reported")
	}
	if result.Freed != 0 || result.Files != 0 {
		t.Fatalf("nothing must be deleted: %+v", result)
	}
}

func TestCleanerScan(t *testing.T) {
	if runtime.GOOS != "windows" {
		t.Skip("the cleaner targets are Windows paths")
	}
	targets, err := (Cleaner{}).Scan(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if len(targets) == 0 {
		t.Fatal("no targets")
	}
	for _, target := range targets {
		if target.Size < 0 || target.Files < 0 {
			t.Errorf("%s: negative size %+v", target.ID, target)
		}
		if target.Path == "" {
			t.Errorf("%s: empty path", target.ID)
		}
	}
}
