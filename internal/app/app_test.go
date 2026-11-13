package app

import (
	"context"
	"os"
	"path/filepath"
	"testing"

	"github.com/egoist/mygo"

	"highgarden/modules/hasher"
)

func TestParseAlgorithm(t *testing.T) {
	for _, name := range []string{"sha256", "SHA-256", " sha2-256 "} {
		if got, err := parseAlgorithm(name); err != nil || got != hasher.SHA256 {
			t.Errorf("parseAlgorithm(%q) = %q, %v; want sha256", name, got, err)
		}
	}
	if got, err := parseAlgorithm("blake3"); err != nil || got != hasher.BLAKE3 {
		t.Errorf("parseAlgorithm(blake3) = %q, %v", got, err)
	}
	if _, err := parseAlgorithm("md5"); err == nil {
		t.Error("parseAlgorithm(md5): want an error")
	}
}

func TestDigestGoFallback(t *testing.T) {
	d := &Digest{} // no native hasher

	got, err := d.Text("sha256", "hello")
	if err != nil {
		t.Fatal(err)
	}
	const want = "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
	if got != want {
		t.Fatalf("Text = %s, want %s", got, want)
	}

	if _, err := d.Text("blake3", "hello"); err == nil {
		t.Fatal("Text(blake3) without the native module: want an error")
	}

	path := filepath.Join(t.TempDir(), "hello.txt")
	if err := os.WriteFile(path, []byte("hello"), 0o600); err != nil {
		t.Fatal(err)
	}
	got, err = d.File(context.Background(), "sha256", path)
	if err != nil {
		t.Fatal(err)
	}
	if got != want {
		t.Fatalf("File = %s, want %s", got, want)
	}
}

func TestPreferencesRoundTrip(t *testing.T) {
	mygo.App.SetPath(mygo.PathUserData, t.TempDir())
	p := NewPreferences()

	got, err := p.Get()
	if err != nil {
		t.Fatal(err)
	}
	if got.Theme != defaultTheme || got.Accent != defaultAccent {
		t.Fatalf("defaults = %+v", got)
	}

	want := Prefs{Theme: "dark", Accent: "violet", Recent: []string{"json", "hash"}, SidebarCollapsed: true}
	if err := p.Set(want); err != nil {
		t.Fatal(err)
	}
	got, err = p.Get()
	if err != nil {
		t.Fatal(err)
	}
	if got.Theme != want.Theme || got.Accent != want.Accent || got.SidebarCollapsed != want.SidebarCollapsed {
		t.Fatalf("Get = %+v, want %+v", got, want)
	}
	if len(got.Recent) != 2 || got.Recent[0] != "json" || got.Recent[1] != "hash" {
		t.Fatalf("Recent = %v", got.Recent)
	}
}

func TestSanitize(t *testing.T) {
	got := sanitize(Prefs{
		Theme:  "neon",
		Accent: "chartreuse",
		Recent: []string{"json", "", "json", "hash"},
	})
	if got.Theme != defaultTheme || got.Accent != defaultAccent {
		t.Fatalf("unknown values were kept: %+v", got)
	}
	if len(got.Recent) != 2 || got.Recent[0] != "json" || got.Recent[1] != "hash" {
		t.Fatalf("Recent = %v", got.Recent)
	}

	many := make([]string, 0, maxRecent+4)
	for i := 0; i < maxRecent+4; i++ {
		many = append(many, string(rune('a'+i)))
	}
	if got := sanitize(Prefs{Recent: many}); len(got.Recent) != maxRecent {
		t.Fatalf("Recent has %d entries, want %d", len(got.Recent), maxRecent)
	}
}
