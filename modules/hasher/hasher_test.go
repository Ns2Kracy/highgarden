package hasher

import (
	"context"
	"os"
	"path/filepath"
	"testing"
)

const hello = "hello"
const helloBLAKE3 = "ea8f163db38682925e4491c5e58d4bb3506ef8c14eb78a86e908c5624a67200f"
const helloSHA256 = "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"

// newTestHasher skips when the module is not built for this machine, which
// `mygo native check` or `mygo dev` does.
func newTestHasher(t *testing.T) Hasher {
	t.Helper()
	h, err := NewHasher()
	if err != nil {
		t.Skipf("native module not built: %v", err)
	}
	return h
}

func TestHashBytes(t *testing.T) {
	h := newTestHasher(t)

	got, err := h.Hash([]byte(hello), SHA256)
	if err != nil {
		t.Fatal(err)
	}
	if got != helloSHA256 {
		t.Fatalf("sha256: got %s, want %s", got, helloSHA256)
	}

	got, err = h.Hash([]byte(hello), BLAKE3)
	if err != nil {
		t.Fatal(err)
	}
	if got != helloBLAKE3 {
		t.Fatalf("blake3: got %s, want %s", got, helloBLAKE3)
	}

	got, err = h.Hash(nil, SHA512)
	if err != nil {
		t.Fatal(err)
	}
	const emptySHA512 = "cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e"
	if got != emptySHA512 {
		t.Fatalf("sha512 of empty input: got %s", got)
	}
}

func TestHashFile(t *testing.T) {
	h := newTestHasher(t)

	path := filepath.Join(t.TempDir(), "hello.txt")
	if err := os.WriteFile(path, []byte(hello), 0o600); err != nil {
		t.Fatal(err)
	}

	got, err := h.HashFile(context.Background(), path, BLAKE3)
	if err != nil {
		t.Fatal(err)
	}
	if got != helloBLAKE3 {
		t.Fatalf("blake3: got %s, want %s", got, helloBLAKE3)
	}

	if _, err := h.HashFile(context.Background(), filepath.Join(t.TempDir(), "missing"), SHA256); err == nil {
		t.Fatal("HashFile of a missing file: want an error")
	}
}
