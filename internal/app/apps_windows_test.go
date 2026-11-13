//go:build windows

package app

import "testing"

func TestInstalledApps(t *testing.T) {
	apps, err := listInstalledApps()
	if err != nil {
		t.Fatal(err)
	}
	if len(apps) == 0 {
		t.Skip("no installed programs in this environment")
	}
	for _, app := range apps {
		if app.ID == "" || app.Name == "" {
			t.Errorf("incomplete app: %+v", app)
		}
		if app.SizeBytes < 0 {
			t.Errorf("%s: negative size", app.Name)
		}
	}
}
