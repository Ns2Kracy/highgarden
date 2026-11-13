//go:build !windows

package app

// batteryStatus is unknown where the platform does not report it.
func batteryStatus() (int, bool) { return -1, false }
