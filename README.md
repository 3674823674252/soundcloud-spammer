# soundcloud-spammer
this is an evil twin of soundcloud-dl-all

use it like this:
 
 node run.js user=USERNAME client=CLIENT_ID

client_id is mandatory!

user is mandatory

dl_root is set to . if not specified

or you can run it programmatically like this:

 require('soundcloud-spammer').dl(client, user, cb)

(client and user params are strings, cb is function)

always specify a callback when calling it like that, it will be invoked after user is completely spammed (client is exhausted).

first argument to callback is an error.	

