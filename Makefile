test:
	./node_modules/.bin/mocha \
		--timeout 60000 \
		--reporter spec 
		test/nobase.js


nbase:
	./node_modules/.bin/mocha \
		--reporter spec \
		--ui bdd \
		--timeout 60000 \
		test/nbase.js	
		
		
		
.PHONY: nobase