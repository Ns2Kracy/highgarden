// Package hasher hashes bytes and files with the algorithms a Rust crate
// provides. It is a native module: see AGENTS.md.
package hasher

import "context"

// Algorithm names a hash function.
type Algorithm string

// The algorithms the module implements.
const (
	SHA256 Algorithm = "sha256"
	SHA512 Algorithm = "sha512"
	BLAKE3 Algorithm = "blake3"
)

// Hasher hashes bytes and files. The implementation lives in rust/.
//
//mygo:native
type Hasher interface {
	// Hash returns the lowercase hex digest of data.
	Hash(data []byte, algorithm Algorithm) (string, error)
	// HashFile returns the lowercase hex digest of the file at path,
	// reading it in chunks. ctx cancels the work.
	HashFile(ctx context.Context, path string, algorithm Algorithm) (string, error)
}
