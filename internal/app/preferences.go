// Package app holds the Go services the toolbox frontend calls, and the
// glue to the Rust native module.
package app

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"slices"
	"strings"
	"sync"

	"github.com/egoist/mygo"
)

// Prefs is what the frontend persists between launches.
type Prefs struct {
	// Theme is "system", "light" or "dark".
	Theme string `json:"theme"`
	// Accent names the accent color preset.
	Accent string `json:"accent"`
	// Recent holds the ids of the tools opened last, newest first.
	Recent []string `json:"recent"`
	// Sidebar remembers whether the sidebar is collapsed.
	SidebarCollapsed bool `json:"sidebarCollapsed"`
}

const (
	defaultTheme  = "system"
	defaultAccent = "blue"
	maxRecent     = 8
)

var themes = []string{"system", "light", "dark"}
var accents = []string{"blue", "violet", "emerald", "amber", "rose", "slate"}

// Preferences reads and writes the user's preferences in a JSON file in the
// app's user data directory. It is safe for concurrent use.
type Preferences struct {
	mu sync.Mutex
}

// NewPreferences returns the preferences service.
func NewPreferences() *Preferences { return &Preferences{} }

func (p *Preferences) path() (string, error) {
	dir, err := mygo.App.Path(mygo.PathUserData)
	if err != nil {
		return "", err
	}
	return filepath.Join(dir, "preferences.json"), nil
}

// Get returns the stored preferences, or their defaults.
func (p *Preferences) Get() (Prefs, error) {
	p.mu.Lock()
	defer p.mu.Unlock()
	return p.read()
}

// Set validates and stores the preferences.
func (p *Preferences) Set(prefs Prefs) error {
	stored := sanitize(prefs)
	p.mu.Lock()
	defer p.mu.Unlock()
	path, err := p.path()
	if err != nil {
		return err
	}
	data, err := json.MarshalIndent(stored, "", "  ")
	if err != nil {
		return err
	}
	tmp := path + ".tmp"
	if err := os.WriteFile(tmp, append(data, '\n'), 0o600); err != nil {
		return err
	}
	return os.Rename(tmp, path)
}

func (p *Preferences) read() (Prefs, error) {
	path, err := p.path()
	if err != nil {
		return sanitize(Prefs{}), err
	}
	data, err := os.ReadFile(path)
	if errors.Is(err, os.ErrNotExist) {
		return sanitize(Prefs{}), nil
	}
	if err != nil {
		return sanitize(Prefs{}), err
	}
	var prefs Prefs
	if err := json.Unmarshal(data, &prefs); err != nil {
		return sanitize(Prefs{}), fmt.Errorf("read preferences: %w", err)
	}
	return sanitize(prefs), nil
}

// sanitize replaces unknown values with the defaults, so a hand-edited file
// or an older version cannot put the frontend in an impossible state.
func sanitize(in Prefs) Prefs {
	out := Prefs{Theme: defaultTheme, Accent: defaultAccent, SidebarCollapsed: in.SidebarCollapsed}
	if slices.Contains(themes, in.Theme) {
		out.Theme = in.Theme
	}
	if slices.Contains(accents, in.Accent) {
		out.Accent = in.Accent
	}
	seen := make(map[string]bool, len(in.Recent))
	for _, id := range in.Recent {
		id = strings.TrimSpace(id)
		if id == "" || seen[id] {
			continue
		}
		seen[id] = true
		out.Recent = append(out.Recent, id)
		if len(out.Recent) == maxRecent {
			break
		}
	}
	return out
}
