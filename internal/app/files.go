package app

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"os"
	"path/filepath"

	"github.com/egoist/mygo"
)

// maxTextSize bounds what a tool may load into the page, in bytes.
const maxTextSize = 16 << 20

// Files opens, reads and writes the text files a tool works on.
type Files struct{}

// Pick asks for a file to open and returns its path, or "" when the user
// cancels.
func (Files) Pick(ctx context.Context) (string, error) {
	paths, err := mygo.Dialog.Open(mygo.OpenDialogOptions{
		Parent:  mygo.CallerWindow(ctx),
		Title:   "Open a file",
		Filters: []mygo.FileFilter{{Name: "All files", Extensions: []string{"*"}}},
	})
	if err != nil || len(paths) == 0 {
		return "", err
	}
	return paths[0], nil
}

// ReadText returns the contents of a UTF-8 text file.
func (Files) ReadText(path string) (string, error) {
	if path == "" {
		return "", errors.New("no file chosen")
	}
	info, err := os.Stat(path)
	if err != nil {
		return "", err
	}
	if info.IsDir() {
		return "", fmt.Errorf("%s is a folder", filepath.Base(path))
	}
	if info.Size() > maxTextSize {
		return "", fmt.Errorf("%s is larger than %d MB", filepath.Base(path), maxTextSize>>20)
	}
	data, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	if bytes.IndexByte(data, 0) >= 0 {
		return "", fmt.Errorf("%s is not a text file", filepath.Base(path))
	}
	return string(data), nil
}

// SaveText asks where to save content and writes it there. It returns the
// chosen path, or "" when the user cancels.
func (Files) SaveText(ctx context.Context, defaultName, content string) (string, error) {
	if defaultName == "" {
		defaultName = "untitled.txt"
	}
	path, err := mygo.Dialog.Save(mygo.SaveDialogOptions{
		Parent:      mygo.CallerWindow(ctx),
		Title:       "Save as",
		DefaultPath: defaultName,
		Filters:     []mygo.FileFilter{{Name: "All files", Extensions: []string{"*"}}},
	})
	if err != nil || path == "" {
		return "", err
	}
	if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
		return "", err
	}
	return path, nil
}
