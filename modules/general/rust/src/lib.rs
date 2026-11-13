//! The implementation of package general in Rust. Implement the methods one
//! at a time: each says it is unsupported until it does.

mod mygo;

use mygo::*;
use std::sync::Arc;

pub fn make_greeter() -> Result<Arc<dyn Greeter>, Error> {
    Ok(Arc::new(NativeGreeter))
}

struct NativeGreeter;

impl Greeter for NativeGreeter {
    fn greet(&self, _name: String) -> Result<String, Error> {
        Err(Error::Unsupported)
    }
}
