//go:build !windows

package app

func listInstalledApps() ([]InstalledApp, error) { return nil, errWindowsOnly }
