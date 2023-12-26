FROM --platform=$BUILDPLATFORM python:3.10-alpine AS builder
COPY . /home/server
WORKDIR /home/server
RUN pip3 install -r requirements.txt
CMD ["/bin/sh", "script.sh"]
