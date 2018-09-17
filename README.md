# Set up test environment

## Start ganache
```
docker run --rm -d --name ganache trufflesuite/ganache-cli:latest --account="0x73dff7a656b0ecc3bb281bd5d14f9f8e77b60355d6274683d2f6fc5e3ab7ac11,1000000000000000000000000"
```

## Start testenv
```
cd testenv && docker build . -t testenv && docker run -d --rm --link ganache:ganache --name testenv testenv
```

## Make sure tests have access to testenv server
(done in `aliases.sh` and `nuclide_start_server`)
