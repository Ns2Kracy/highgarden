package app

import (
	"context"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"strings"
)

// errWindowsOnly is returned by the tools that use Windows' own registry,
// uninstallers and startup entries.
var errWindowsOnly = errors.New("this tool is only available on Windows")

// InstalledApp is a program the system knows how to uninstall.
type InstalledApp struct {
	ID               string `json:"id"`
	Name             string `json:"name"`
	Version          string `json:"version"`
	Publisher        string `json:"publisher"`
	InstallLocation  string `json:"installLocation"`
	UninstallCommand string `json:"uninstallCommand"`
	SizeBytes        int64  `json:"sizeBytes"`
	InstallDate      string `json:"installDate"`
	// Scope is "machine" or "user": where the entry lives.
	Scope string `json:"scope"`
	// NeedsAdmin is set for machine-wide entries.
	NeedsAdmin bool `json:"needsAdmin"`
}

// Apps lists installed programs and runs their uninstallers. The page shows
// the exact command before asking Go to run it.
type Apps struct{}

// List returns the programs registered in the uninstall registry keys.
func (Apps) List() ([]InstalledApp, error) { return listInstalledApps() }

// Uninstall runs the uninstaller of id and returns what it printed. The
// uninstaller may open its own window and return before it finishes.
func (a Apps) Uninstall(ctx context.Context, id string) (string, error) {
	apps, err := listInstalledApps()
	if err != nil {
		return "", err
	}
	var app *InstalledApp
	for i := range apps {
		if apps[i].ID == id {
			app = &apps[i]
			break
		}
	}
	if app == nil {
		return "", errors.New("that program is no longer installed; refresh the list")
	}
	command := strings.TrimSpace(app.UninstallCommand)
	if command == "" {
		return "", fmt.Errorf("%s does not register an uninstall command; use Windows Settings > Apps", app.Name)
	}
	cmd := exec.CommandContext(ctx, "cmd", "/c", command)
	if app.InstallLocation != "" {
		if info, err := os.Stat(app.InstallLocation); err == nil && info.IsDir() {
			cmd.Dir = app.InstallLocation
		}
	}
	out, err := cmd.CombinedOutput()
	text := strings.TrimSpace(string(out))
	if len(text) > 4000 {
		text = text[:4000] + "…"
	}
	if err != nil {
		return text, fmt.Errorf("uninstall %s: %w", app.Name, err)
	}
	return text, nil
}
