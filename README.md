# Countdown Solvers

Work in progress. Currently supports finding exact solutions to the
numbers round and longest words in the letters round (according to
a non-official dictionary).

## Running Locally

Due to the use of web workers, this project cannot be served from the filesystem directly; a web server must be used. A simple example:

```sh
npm install -g http-server;
http-server . -p 8080 -o;
```
