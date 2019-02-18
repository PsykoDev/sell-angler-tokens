module.exports = function SellAnglerTokens(mod) {
	let SellerNpc = null,
		TokenNpc = null,
		enabled = false,
		playerLocation = null,
		delay=500,
		scrolls=null,tokensAmount=0,s,t;

	mod.hook('S_REQUEST_CONTRACT', 1, event => {
		if (enabled && mod.game.me.is(event.senderId)) {
			if(event.type==20){
				TokenNpc.contractId=event.id;
				if(TokenNpc.buyed){
					setTimeout(() => {
						mod.send('C_CANCEL_CONTRACT', 1, {
							type: 20,
							id: TokenNpc.contractId
						});
					}, delay);
					
				}else{
					TokenNpc.buyed=true;
					if(tokensAmount>=800)
						setTimeout(() => {
							buyRecipes();
						}, delay);
					else{
						mod.command.message("No more tokens");
						enabled=false;
					}	
				}
			}
			if(event.type==9){
				SellerNpc.contractId=event.id;
				if(SellerNpc.selled){
					setTimeout(() => {
						mod.send('C_CANCEL_CONTRACT', 1, {
							type: 9,
							id: SellerNpc.contractId
						});
					}, delay);
					
				}else{
					SellerNpc.selled=true;
					setTimeout(() => {
						sellRecipes();
					}, delay);
				}
			}
		}
	});
	mod.hook('S_CANCEL_CONTRACT', 1, event => {
		if (enabled && mod.game.me.is(event.senderId)) {
			if(event.type==20){
				TokenNpc.buyed=false;
				setTimeout(() => {
					mod.send('C_NPC_CONTACT', 2, {
						gameId: SellerNpc.gameId
					})
				}, delay);
			}
			if(event.type==9){
				SellerNpc.selled=false;
				setTimeout(() => {
					mod.send('C_NPC_CONTACT', 2, {
						gameId: TokenNpc.gameId
					})
				}, delay);
			}
		}
	});
	mod.hook('C_PLAYER_LOCATION', 5, event => {
			playerLocation = event.loc;
	});
	mod.hook('S_MEDAL_STORE_BASKET', 1, event => {
			if(enabled){
				if(event.credits>=event.cost&&event.cost==800)
					setTimeout(() => {
						mod.send('C_MEDAL_STORE_COMMIT', 1, {
							gameId: mod.game.me.gameId,
							contract: TokenNpc.contractId
						});
					}, delay);
				else
					enabled=false;
			}
	});
	mod.hook('S_SPAWN_NPC',  11, event => {
		if (event.templateId == 9903) {
			s = event;
		}
		if (event.templateId == 9904) {
			t = event;
		}
	});
	mod.hook('S_INVEN', 17, event => {
		if (event.items.length == 0) return;
		event.items.forEach(function (obj) {
			if (obj.id == 204200) {
				scrolls = obj;
			}
		});
		if(event.first)
			tokensAmount=0;
		event.items.forEach(function (obj) {
			if (obj.id == 204051) {
				tokensAmount += obj.amount;
			}
		});
	});
	mod.hook('S_DIALOG', 2, event => {
		if (enabled) {
			if (event.gameId == TokenNpc.gameId) {
				TokenNpc.dialogId = event.id;
				setTimeout(() => {
					mod.send('C_DIALOG', 1, {
						id: TokenNpc.dialogId,
						index: 1,
						questReward: -1,
						unk: -1
					})
				}, 200);
			}
			if(event.gameId == SellerNpc.gameId){
				SellerNpc.dialogId = event.id;
				setTimeout(() => {
					mod.send('C_DIALOG', 1, {
						id: SellerNpc.dialogId,
						index: 1,
						questReward: -1,
						unk: -1
					})
				}, 200);
			}
		}
	});
	mod.tryHook('S_STORE_BASKET', 'raw', _ => {
		if (enabled) {
			setTimeout(() => {
				mod.send('C_STORE_COMMIT', 1, {
					gameId: mod.game.me.gameId,
					npc: SellerNpc.contractId
				});
			}, delay);
			
		}
	});
	function buyRecipes(){
		mod.send('C_MEDAL_STORE_BUY_ADD_BASKET', 1, {
			gameId: mod.game.me.gameId,
			contract: TokenNpc.contractId,
			item: 204200,
			amount: 80
		});
	}
	function sellRecipes(){
		mod.send('C_STORE_SELL_ADD_BASKET', 1, {
			cid: mod.game.me.gameId,
			npc: SellerNpc.contractId,
			item: scrolls.id,
			quantity: 80,
			slot:scrolls.slot
		});
	}
	mod.command.add('selltokens', {
		$none() {
			enabled = !enabled;
			if (enabled) {
				mod.command.message('Start selling tokens'); //10m = 250 units
				if (s == null || s.loc.dist3D(playerLocation) > 250) {
					mod.command.message("No seller NPC near you");
					enabled=false;
					return;
				}
				if (t == null || t.loc.dist3D(playerLocation) > 250) {
					mod.command.message("No Token Npc near you");
					enabled=false;
					return;
				}
				SellerNpc=Object.create(s);
				TokenNpc=Object.create(t);
				scrolls=null;
				mod.send('C_NPC_CONTACT', 2, {
					gameId: TokenNpc.gameId
				})
			}else{
				mod.command.message("mod disabled");
			}
		},
		delay(value){
			delay=parseInt(value);
		}

	});
}