mongod --shutdown --dbpath ./data &
forever stop app.js &
forever start app.js &
mkdir -p ./logs/mongo/ &
mongod --dbpath ./data --fork --logpath ./logs/mongo/mongodb.log
