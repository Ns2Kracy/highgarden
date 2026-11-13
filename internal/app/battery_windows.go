//go:build windows

package app

import (
	"unsafe"

	"golang.org/x/sys/windows"
)

var procGetSystemPowerStatus = windows.NewLazySystemDLL("kernel32.dll").NewProc("GetSystemPowerStatus")

// systemPowerStatus is SYSTEM_POWER_STATUS.
type systemPowerStatus struct {
	ACLineStatus        byte
	BatteryFlag         byte
	BatteryLifePercent  byte
	SystemStatusFlag    byte
	BatteryLifeTime     uint32
	BatteryFullLifeTime uint32
}

// batteryStatus returns the battery percentage and whether the machine is on
// AC power. A desktop without a battery reports -1.
func batteryStatus() (int, bool) {
	var status systemPowerStatus
	ok, _, _ := procGetSystemPowerStatus.Call(uintptr(unsafe.Pointer(&status)))
	if ok == 0 || status.BatteryLifePercent == 255 {
		return -1, false
	}
	return int(status.BatteryLifePercent), status.ACLineStatus == 1
}
