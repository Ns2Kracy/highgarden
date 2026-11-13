//! The implementation of package hasher in Rust: SHA-256, SHA-512 and
//! BLAKE3 over bytes and files, streaming files in 1 MiB chunks.

mod mygo;

use mygo::*;
use sha2::digest::Digest as Sha2;
use sha2::{Sha256, Sha512};
use std::io::Read;
use std::sync::Arc;

pub fn make_hasher() -> Result<Arc<dyn Hasher>, Error> {
    Ok(Arc::new(NativeHasher))
}

struct NativeHasher;

enum Sum {
    Sha256(Sha256),
    Sha512(Sha512),
}

impl Sum {
    fn update(&mut self, bytes: &[u8]) {
        match self {
            Sum::Sha256(h) => h.update(bytes),
            Sum::Sha512(h) => h.update(bytes),
        }
    }

    fn finish(self) -> String {
        match self {
            Sum::Sha256(h) => hex(&h.finalize()),
            Sum::Sha512(h) => hex(&h.finalize()),
        }
    }
}

fn hex(bytes: &[u8]) -> String {
    const HEX: &[u8; 16] = b"0123456789abcdef";
    let mut s = String::with_capacity(bytes.len() * 2);
    for b in bytes {
        s.push(HEX[(b >> 4) as usize] as char);
        s.push(HEX[(b & 0x0f) as usize] as char);
    }
    s
}

fn read_error(path: &str, e: std::io::Error) -> Error {
    Error::other(format!("{path}: {e}"))
}

impl Hasher for NativeHasher {
    fn hash(&self, data: Vec<u8>, algorithm: Algorithm) -> Result<String, Error> {
        Ok(match algorithm {
            Algorithm::SHA256 => hex(&Sha256::digest(&data)),
            Algorithm::SHA512 => hex(&Sha512::digest(&data)),
            Algorithm::BLAKE3 => blake3::hash(&data).to_hex().to_string(),
        })
    }

    fn hash_file(&self, ctx: &Context, path: String, algorithm: Algorithm) -> Result<String, Error> {
        let mut file = std::fs::File::open(&path).map_err(|e| read_error(&path, e))?;
        let mut buf = vec![0u8; 1 << 20];

        let mut sum = match algorithm {
            Algorithm::SHA256 => Some(Sum::Sha256(Sha256::new())),
            Algorithm::SHA512 => Some(Sum::Sha512(Sha512::new())),
            Algorithm::BLAKE3 => None,
        };
        let mut blake = if sum.is_none() {
            Some(blake3::Hasher::new())
        } else {
            None
        };

        loop {
            ctx.check()?;
            let n = file.read(&mut buf).map_err(|e| read_error(&path, e))?;
            if n == 0 {
                break;
            }
            match (&mut sum, &mut blake) {
                (Some(s), _) => s.update(&buf[..n]),
                (_, Some(h)) => {
                    h.update(&buf[..n]);
                }
                _ => return Err(Error::other("no hash selected")),
            }
        }

        Ok(match (sum, blake) {
            (Some(s), _) => s.finish(),
            (_, Some(h)) => h.finalize().to_hex().to_string(),
            _ => return Err(Error::other("no hash selected")),
        })
    }
}
