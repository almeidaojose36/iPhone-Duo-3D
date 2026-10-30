#!/bin/zsh
# Create the HyperFrames project skeleton for a chapter: scaffold.sh c2 "Inside the iPhone Duo · The hinge"
cd "${0:A:h}/.." || exit 1
p=$1; name=$2
mkdir -p $p/assets/js $p/compositions $p/renders
cd $p/assets
for l in fonts vendor sfx models; do ln -sfn ../../shared/$l $l; done
cd js
for l in engine.js fx.js duo.js; do ln -sfn ../../../shared/js/$l $l; done
cd ../..
cp ../../ch2/hyperframes.json .
cat > meta.json <<J
{ "id": "duo-$p", "name": "$name", "createdAt": "2026-10-29T00:00:00.000Z" }
J
cat > package.json <<J
{
  "name": "duo-$p",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "npx --yes hyperframes@0.8.193 preview",
    "check": "npx --yes hyperframes@0.8.193 check",
    "render": "npx --yes hyperframes@0.8.193 render"
  }
}
J
echo "scaffolded $p"
