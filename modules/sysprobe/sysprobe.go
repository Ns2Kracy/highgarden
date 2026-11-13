// Package sysprobe reports what the machine is doing and which devices are
// attached. It is a native module: the implementation lives in rust/.
package sysprobe

import "context"

// Disk is a mounted volume.
type Disk struct {
	Name       string `json:"name"`
	MountPoint string `json:"mountPoint"`
	FileSystem string `json:"fileSystem"`
	Total      uint64 `json:"total"`
	Available  uint64 `json:"available"`
	Removable  bool   `json:"removable"`
}

// Process is a running process, as a snapshot counts it.
type Process struct {
	PID    uint32  `json:"pid"`
	Name   string  `json:"name"`
	Memory uint64  `json:"memory"`
	CPU    float64 `json:"cpu"`
}

// Snapshot is a point-in-time view of the machine.
type Snapshot struct {
	Hostname        string    `json:"hostname"`
	OSName          string    `json:"osName"`
	OSVersion       string    `json:"osVersion"`
	KernelVersion   string    `json:"kernelVersion"`
	CPUName         string    `json:"cpuName"`
	CPUCores        int       `json:"cpuCores"`
	CPUUsage        float64   `json:"cpuUsage"`
	MemoryTotal     uint64    `json:"memoryTotal"`
	MemoryUsed      uint64    `json:"memoryUsed"`
	SwapTotal       uint64    `json:"swapTotal"`
	SwapUsed        uint64    `json:"swapUsed"`
	UptimeSeconds   int64     `json:"uptimeSeconds"`
	ProcessCount    int       `json:"processCount"`
	Disks           []Disk    `json:"disks"`
	Processes       []Process `json:"processes"`
	BatteryPercent  int       `json:"batteryPercent"`
	BatteryCharging bool      `json:"batteryCharging"`
}

// Device is a Plug and Play device.
type Device struct {
	// ID is the device instance ID, unique on the machine.
	ID string `json:"id"`
	// Name is the device's description, such as "USB Input Device".
	Name string `json:"name"`
	// Class is its PnP class, such as "USB", "HIDClass" or "Display".
	Class string `json:"class"`
	// Manufacturer is the vendor, when the driver reports one.
	Manufacturer string `json:"manufacturer"`
	// Status is "OK" or the status the driver reports.
	Status string `json:"status"`
	// ErrorCode is the Windows problem code, 0 when there is none.
	ErrorCode int32 `json:"errorCode"`
	// DriverVersion is the version of its driver, when known.
	DriverVersion string `json:"driverVersion"`
}

// Probe reads the machine and its devices.
//
//mygo:native
type Probe interface {
	// Snapshot reports CPU, memory, disks, uptime and the busiest processes.
	Snapshot(ctx context.Context) (Snapshot, error)
	// Devices lists the Plug and Play devices that are present.
	Devices(ctx context.Context) ([]Device, error)
}
