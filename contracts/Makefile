.PHONY: build test clean install-deps

include .env
export

install-deps:
	@echo "Installing dependencies..."
	forge install OpenZeppelin/openzeppelin-contracts

build:
	forge build

test:
	forge test

clean:
	forge clean

fmt:
	forge fmt

snapshot:
	forge snapshot
