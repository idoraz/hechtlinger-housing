sudo git fetch
sudo git reset --hard origin/master
npm i
pm2 delete index
pm2 start index.js