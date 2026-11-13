package app

// StartupItem is a program the system launches when a user signs in.
type StartupItem struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Command  string `json:"command"`
	Location string `json:"location"`
	// Scope is "machine" or "user".
	Scope string `json:"scope"`
	// Enabled is false for entries this app disabled, which stay listed.
	Enabled bool `json:"enabled"`
	// CanToggle is false for entries this app cannot safely move.
	CanToggle  bool `json:"canToggle"`
	NeedsAdmin bool `json:"needsAdmin"`
}

// Startup lists and toggles the entries of the Run registry keys and the
// Startup folders. Disabled entries are moved aside, not deleted.
type Startup struct{}

// List returns enabled and disabled startup entries.
func (Startup) List() ([]StartupItem, error) { return listStartup() }

// SetEnabled enables or disables an entry, moving it between its Run key and
// this app's backup key, or renaming a Startup folder entry.
func (Startup) SetEnabled(id string, enabled bool) error {
	return setStartupEnabled(id, enabled)
}
