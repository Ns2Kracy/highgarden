//go:build !windows

package app

func listStartup() ([]StartupItem, error) { return nil, errWindowsOnly }

func setStartupEnabled(string, bool) error { return errWindowsOnly }
