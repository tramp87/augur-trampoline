# some useful aliases for development

alias tdbuildbase='docker build -f Dockerfile.base -t tbase .'
alias tdbuildbuild='docker build -f Dockerfile.build --build-arg HOST=${DEVHOST:-$(hostname)} -t tbuild .'
alias tdbuilddev='docker build -f Dockerfile.dev -t tdev .'
alias tdrun='docker run --link ganache:ganache --link testenv:testenv -it --rm -e NODE_ENV=development -e LOCAL_USER_ID=`id -u $USER` -v "$(pwd)":/src'
alias td='tdrun tdev'
alias tdserve='tdrun -p 3000:3000 tdev yarn start'
alias tflowpeek='docker exec -it -u user $(docker ps -f "label=augur-trampoline-nuclide-server-container" -q) bash -c "cd /src/augur-trampoline/ && yarn flow:watch"'
