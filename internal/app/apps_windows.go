//go:build windows

package app

import (
	"errors"
	"sort"
	"strings"

	"golang.org/x/sys/windows/registry"
)

type uninstallRoot struct {
	scope string
	path  string
	key   registry.Key
}

var uninstallRoots = []uninstallRoot{
	{"machine", `SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall`, registry.LOCAL_MACHINE},
	{"machine", `SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall`, registry.LOCAL_MACHINE},
	{"user", `SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall`, registry.CURRENT_USER},
}

func listInstalledApps() ([]InstalledApp, error) {
	var apps []InstalledApp
	var failed []error

	for _, root := range uninstallRoots {
		key, err := registry.OpenKey(root.key, root.path, registry.READ)
		if err != nil {
			continue // the 32-bit view or HKCU key may not exist
		}
		names, err := key.ReadSubKeyNames(-1)
		key.Close()
		if err != nil {
			failed = append(failed, err)
			continue
		}
		for _, name := range names {
			sub, err := registry.OpenKey(root.key, root.path+`\`+name, registry.READ)
			if err != nil {
				continue
			}
			app, ok := readInstalledApp(sub, root, name)
			sub.Close()
			if ok {
				apps = append(apps, app)
			}
		}
	}

	if len(apps) == 0 && len(failed) > 0 {
		return nil, errors.Join(failed...)
	}
	sort.Slice(apps, func(i, j int) bool {
		return strings.ToLower(apps[i].Name) < strings.ToLower(apps[j].Name)
	})
	return apps, nil
}

func readInstalledApp(key registry.Key, root uninstallRoot, name string) (InstalledApp, bool) {
	display, _, err := key.GetStringValue("DisplayName")
	if err != nil || strings.TrimSpace(display) == "" {
		return InstalledApp{}, false
	}
	// Updates and runtime components are not things to uninstall.
	if component, _, err := key.GetIntegerValue("SystemComponent"); err == nil && component == 1 {
		return InstalledApp{}, false
	}

	version, _, _ := key.GetStringValue("DisplayVersion")
	publisher, _, _ := key.GetStringValue("Publisher")
	location, _, _ := key.GetStringValue("InstallLocation")
	uninstall, _, _ := key.GetStringValue("UninstallString")
	installDate, _, _ := key.GetStringValue("InstallDate")
	var size int64
	if kilobytes, _, err := key.GetIntegerValue("EstimatedSize"); err == nil {
		size = int64(kilobytes) * 1024
	}

	return InstalledApp{
		ID:               root.scope + "|" + root.path + "|" + name,
		Name:             strings.TrimSpace(display),
		Version:          version,
		Publisher:        publisher,
		InstallLocation:  location,
		UninstallCommand: uninstall,
		SizeBytes:        size,
		InstallDate:      installDate,
		Scope:            root.scope,
		NeedsAdmin:       root.scope == "machine",
	}, true
}
