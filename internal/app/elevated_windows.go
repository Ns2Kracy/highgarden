//go:build windows

package app

import "golang.org/x/sys/windows"

// isElevated reports whether the process has administrator rights.
func isElevated() bool {
	return windows.GetCurrentProcessToken().IsElevated()
}
