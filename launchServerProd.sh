mongod --shutdown --dbpath ./data &
forever start app.js &
mkdir -p ./logs/mongo/ &
mongod --dbpath ./data --fork --logpath ./logs/mongo/mongodb.log
