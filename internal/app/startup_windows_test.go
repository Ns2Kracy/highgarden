//go:build windows

package app

import "testing"

func TestStartupIDRoundTrip(t *testing.T) {
	id := startupID{Scope: "user", Kind: "run", Path: `Software\Microsoft\Windows\CurrentVersion\Run`, Name: "Example"}
	got, err := decodeStartupID(encodeStartupID(id))
	if err != nil {
		t.Fatal(err)
	}
	if got != id {
		t.Fatalf("round trip = %+v, want %+v", got, id)
	}
	if _, err := decodeStartupID("not base64!"); err == nil {
		t.Fatal("invalid id must fail")
	}
}

func TestDisabledValueName(t *testing.T) {
	const path = `Software\Microsoft\Windows\CurrentVersion\Run`
	const name = "An app"
	gotPath, gotName, ok := decodeDisabledValueName(disabledValueName(path, name))
	if !ok || gotPath != path || gotName != name {
		t.Fatalf("decode = %q, %q, %v", gotPath, gotName, ok)
	}
}

func TestStartupList(t *testing.T) {
	items, err := listStartup()
	if err != nil {
		t.Fatal(err)
	}
	for _, item := range items {
		if item.ID == "" || item.Name == "" {
			t.Errorf("incomplete item: %+v", item)
		}
		if item.Scope != "user" && item.Scope != "machine" {
			t.Errorf("%s: scope %q", item.Name, item.Scope)
		}
	}
}
