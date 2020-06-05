# Dotfiles Setup

I currently keep my dotfiles in a GitHub repo ([here](https://github.com/quid256/dotfiles2)).
I use the bare git repo trick that made the rounds a while ago. The reference I used to set everything
up was [this blog post](https://www.anand-iyer.com/blog/2018/a-simpler-way-to-manage-your-dotfiles.html).
The following is a reproduction of that blog post for the sake of longevity.

### Pulling to a new machine
This is more common. Run
```bash
git clone --separate-git-dir=$HOME/.dotfiles https://github.com/quid256/dotfiles2.git tmpdotfiles
rsync --recursive --verbose --exclude '.git' tmpdotfiles/ $HOME/
rm -r tmpdotfiles
```
This will clone the dotfiles into a tmp directory, synchronize them with local copies that may exist,
and delete the temporary copies.

To set up the `dotfiles` command, add
```bash
alias dotfiles='/usr/local/bin/git --git-dir=$HOME/.dotfiles/ --work-tree=$HOME'
```
to `~/.zshrc`. Source it, and then run
```bash
dotfiles config --local status.showUntrackedFiles no
```
Then, you can use the dotfiles command just as you would `git`. 
### Creating a new dotfiles repo
This is *very* initial. Only need to be done when a new environment like this is created.
Note for future self -- this is likely not necessary for you.

To create the git repo, execute
```bash
mkdir $HOME/.dotfiles
git init --bare $HOME/.dotfiles
```
Then, setup the `dotfiles` command as specified above, and run
```bash
dotfiles remote add origin git@github.com:[username]/[repo].git
```
to add the appropriate remote
