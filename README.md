# Z, the Zicht automation tool #

Originally developed as a PHP console application, Z is being ported to JavaScript to gain access to a greater
audience, reiterate over some of the clunky features of the original version and slim down the code base.

Currently, the parser grammar is being developed using [PEG.js](http://pegjs.org/).

Please refer to the [doc/](doc/) directory for more info.

# Quick peek #
Z is a simple declarative metaprogramming language to generate shell scripts.

Example:

```
envs = {
    production: {
        remote: "production",
        ssh: "homer@example.org"
    }
}

init(env = "production"):
    git remote add $(env) $(envs[env].ssh):repo.git

@depends(&init)
deploy(env = "production"):
    git push $(env) master
```

Running this with `z deploy production` would execute the following two lines in a `/bin/bash` shell:

```
git remote add production homer@example.org:repo.git
git push production master
```
