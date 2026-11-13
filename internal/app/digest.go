package app

import (
	"context"
	"crypto/sha256"
	"crypto/sha512"
	"encoding/hex"
	"fmt"
	"hash"
	"io"
	"os"
	"strings"

	"highgarden/modules/hasher"
)

// Digest hashes text and files. It uses the Rust module when it loaded and
// falls back to Go's crypto package otherwise.
type Digest struct {
	native hasher.Hasher
}

// NewDigest loads the native hasher, if the platform has one.
func NewDigest() *Digest {
	h, err := hasher.NewHasher()
	if err != nil {
		return &Digest{}
	}
	return &Digest{native: h}
}

// Available reports whether the Rust implementation is loaded.
func (d *Digest) Available() bool { return d.native != nil }

// Engine names what hashes: "rust" or "go".
func (d *Digest) Engine() string {
	if d.native != nil {
		return "rust"
	}
	return "go"
}

// Text returns the hex digest of text.
func (d *Digest) Text(algorithm, text string) (string, error) {
	algo, err := parseAlgorithm(algorithm)
	if err != nil {
		return "", err
	}
	if d.native != nil {
		return d.native.Hash([]byte(text), algo)
	}
	sum := newGoHash(algo)
	if sum == nil {
		return "", fmt.Errorf("%s needs the native module", algorithm)
	}
	sum.Write([]byte(text))
	return hex.EncodeToString(sum.Sum(nil)), nil
}

// File returns the hex digest of the file at path. ctx cancels reading.
func (d *Digest) File(ctx context.Context, algorithm, path string) (string, error) {
	algo, err := parseAlgorithm(algorithm)
	if err != nil {
		return "", err
	}
	if path == "" {
		return "", fmt.Errorf("no file chosen")
	}
	if d.native != nil {
		return d.native.HashFile(ctx, path, algo)
	}
	sum := newGoHash(algo)
	if sum == nil {
		return "", fmt.Errorf("%s needs the native module", algorithm)
	}
	f, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer f.Close()
	buf := make([]byte, 1<<20)
	for {
		if err := ctx.Err(); err != nil {
			return "", err
		}
		n, err := f.Read(buf)
		if n > 0 {
			sum.Write(buf[:n])
		}
		if err == io.EOF {
			break
		}
		if err != nil {
			return "", err
		}
	}
	return hex.EncodeToString(sum.Sum(nil)), nil
}

func newGoHash(algorithm hasher.Algorithm) hash.Hash {
	switch algorithm {
	case hasher.SHA256:
		return sha256.New()
	case hasher.SHA512:
		return sha512.New()
	default:
		return nil
	}
}

func parseAlgorithm(name string) (hasher.Algorithm, error) {
	switch strings.ToLower(strings.TrimSpace(name)) {
	case "sha256", "sha-256", "sha2-256":
		return hasher.SHA256, nil
	case "sha512", "sha-512", "sha2-512":
		return hasher.SHA512, nil
	case "blake3", "b3":
		return hasher.BLAKE3, nil
	default:
		return "", fmt.Errorf("unknown algorithm %q", name)
	}
}
