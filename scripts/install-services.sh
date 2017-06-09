# Node 8
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -

# MongoDB
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 0C49F3730359A14518585931BC711F9BA15703C6
echo "deb [ arch=amd64,arm64 ] http://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/3.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.4.list

# Yarn
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list

# install packages
sudo apt-get update
sudo apt-get install -y nodejs build-essential
sudo apt-get install mongodb-org nginx yarn

# Config & Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# install PM2 / Typescript
sudo yarn global add pm2 typescript
pm2 startup systemd

# start mongod, add service
sudo systemctl start mongodb
sudo systemctl enable mongodb
