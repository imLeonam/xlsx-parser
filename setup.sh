
#Colors

GREEN='\033[1;32m'
BLUE='\033[1;34m'
PURPLE='\033[1;35m'
NC='\033[0m'

echo -e "${NC}Você está utilizando o Ubuntu 20.04? [y/n]";
read question;
if [ $question == "y" ];
then
    sudo apt-get install libssl-dev
    sudo apt-get install autoconf bison patch build-essential rustc libssl-dev libyaml-dev libreadline6-dev zlib1g-dev libgmp-dev libncurses5-dev libffi-dev libgdbm6 libgdbm-dev libdb-dev uuid-dev
fi


#Initial configuration ASDF
if [ -d ~/.asdf/ ];
then
        echo -e "${NC}O asdf já foi baixado!";
        echo -e "";
        echo -e "${NC}Deseja reinstalar o asdf? [y/n]";
        read yes_no;
        if [ $yes_no == "y" ];
        then
            echo -e "";
            echo -e "${PURPLE}Apagando asdf para reconfigurar";

            asdf uninstall nodejs 14.16.0
            asdf uninstall nodejs 16.14.0

            sudo apt-get remove asdf
            rm -rf ~/.asdf

            echo ""
            echo -e "${GREEN}Initial configuration ASDF:"

            git clone -b v0.9.0 https://github.com/asdf-vm/asdf.git ~/.asdf
            echo -e '\n. $HOME/.asdf/asdf.sh' >> ~/.bashrc
            echo -e '\n. $HOME/.asdf/completions/asdf.bash' >> ~/.bashrc
            source ~/.bashrc
        else
            exit 1
        fi
else
    echo ""
    echo -e "${GREEN}Initial configuration ASDF:";

    git clone -b v0.9.0 https://github.com/asdf-vm/asdf.git ~/.asdf
    echo -e '\n. $HOME/.asdf/asdf.sh' >> ~/.bashrc
    echo -e '\n. $HOME/.asdf/completions/asdf.bash' >> ~/.bashrc
    source ~/.bashrc;
fi

echo ""
echo -e "${GREEN}Install ASDF plugin Node:";
asdf plugin-add nodejs
asdf install nodejs 14.16.0
asdf install nodejs 16.14.0
asdf global nodejs 16.14.0
node -v
npm install yarn -g
npm install pm2 -g
