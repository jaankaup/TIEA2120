#! /bin/sh -e

SRC_FILE=$1
#FILE=funktiot$(date +%Y-%m-%eZ%H:%M:%S)
FILE=javascriptFunktiot

date > $FILE
echo ' ' >> $FILE
echo $SRC_FILE >> $FILE
echo ' ' >> $FILE
echo Functiot: >> $FILE
echo ' ' >> $FILE
cat vt3.js |grep function |sed 's/{//' >> $FILE 
