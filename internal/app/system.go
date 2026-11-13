package app

import (
	"context"
	"fmt"
	"os"
	"runtime"

	"github.com/egoist/mygo"

	"highgarden/modules/sysprobe"
)

// SystemInfo describes the app and the machine it runs on.
type SystemInfo struct {
	OS         string `json:"os"`
	Arch       string `json:"arch"`
	GoVersion  string `json:"goVersion"`
	Hostname   string `json:"hostname"`
	NumCPU     int    `json:"numCPU"`
	Engine     string `json:"engine"`
	AppVersion string `json:"appVersion"`
	Packaged   bool   `json:"packaged"`
	Elevated   bool   `json:"elevated"`
	DataDir    string `json:"dataDir"`
}

// System reports information about the app and the machine, reads live
// snapshots through the native module and opens the system's own pages.
type System struct {
	// Engine is "rust" when the native hasher loaded, "go" otherwise.
	Engine string
	probe  probeClient
	cpu    cpuSampler
}

// NewSystem returns the system service.
func NewSystem(engine string) *System { return &System{Engine: engine} }

// Info describes the app and the machine.
func (s *System) Info() SystemInfo {
	host, _ := os.Hostname()
	dir, _ := mygo.App.Path(mygo.PathUserData)
	engine := s.Engine
	if engine == "" {
		engine = "go"
	}
	return SystemInfo{
		OS:         runtime.GOOS,
		Arch:       runtime.GOARCH,
		GoVersion:  runtime.Version(),
		Hostname:   host,
		NumCPU:     runtime.NumCPU(),
		Engine:     engine,
		AppVersion: mygo.App.Version(),
		Packaged:   mygo.App.IsPackaged(),
		Elevated:   isElevated(),
		DataDir:    dir,
	}
}

// Overview returns a live snapshot of the machine: CPU, memory, disks,
// uptime and the processes using the most memory.
func (s *System) Overview(ctx context.Context) (sysprobe.Snapshot, error) {
	probe, err := s.probe.get()
	if err != nil {
		return sysprobe.Snapshot{}, err
	}
	snapshot, err := probe.Snapshot(ctx)
	if err != nil {
		return snapshot, err
	}
	snapshot.BatteryPercent, snapshot.BatteryCharging = batteryStatus()
	if usage := s.cpu.usage(); usage >= 0 {
		snapshot.CPUUsage = usage
	}
	return snapshot, nil
}

// Devices lists the Plug and Play devices that are present.
func (s *System) Devices(ctx context.Context) ([]sysprobe.Device, error) {
	probe, err := s.probe.get()
	if err != nil {
		return nil, err
	}
	return probe.Devices(ctx)
}

var systemPages = map[string]string{
	"apps":        "ms-settings:appsfeatures",
	"startup":     "ms-settings:startupapps",
	"devices":     "devmgmt.msc",
	"bluetooth":   "ms-settings:bluetooth",
	"display":     "ms-settings:display",
	"sound":       "ms-settings:sound",
	"storage":     "ms-settings:storagesense",
	"update":      "ms-settings:windowsupdate",
	"about":       "ms-settings:about",
	"taskmanager": "taskmgr",
}

// OpenPage opens one of the system's own settings pages or tools. It only
// accepts the names in systemPages, never a path from the page.
func (s *System) OpenPage(name string) error {
	target, ok := systemPages[name]
	if !ok {
		return fmt.Errorf("unknown system page %q", name)
	}
	return mygo.Shell.OpenPath(target)
}

// OpenDataDir shows the app's user data directory in the file manager.
func (s *System) OpenDataDir() error {
	dir, err := mygo.App.Path(mygo.PathUserData)
	if err != nil {
		return err
	}
	return mygo.Shell.OpenPath(dir)
}
