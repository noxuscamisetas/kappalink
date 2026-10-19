'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const config=JSON.parse(fs.readFileSync('vercel.json','utf8'));
const {stores}=JSON.parse(fs.readFileSync('config/stores.json','utf8'));
const hosts=new Set(),ids=new Set();
for(const store of stores){
 assert(/^[a-z0-9-]+$/.test(store.id),'Identificador inválido');assert(!ids.has(store.id),'Pasta duplicada');ids.add(store.id);
 assert(typeof store.demo==='boolean');assert(store.demo||store.contact_verified===true,'Cliente real exige destinatário conferido');
 for(const host of store.hosts){assert(/^[a-z0-9-]+\.kappalink\.com$/.test(host));assert(!hosts.has(host),'Endereço duplicado');hosts.add(host);
  const rule=config.routes.find(r=>r.dest&&r.has?.some(h=>h.type==='host'&&new RegExp('^(?:'+h.value+')$').test(host)));
  assert.equal(rule?.dest,'/'+store.id+'/$1','Endereço não encaminha à pasta cadastrada');
 }
 for(const file of ['index.html','pedido.html'])assert(fs.existsSync(path.join('public',store.id,file)),'Página ausente');
}
for(const entry of fs.readdirSync('public',{withFileTypes:true})){if(entry.isDirectory()&&fs.existsSync(path.join('public',entry.name,'index.html'))&&fs.existsSync(path.join('public',entry.name,'pedido.html')))assert(ids.has(entry.name),'Loja sem cadastro de segurança: '+entry.name);}
const headers=config.routes[0].headers;assert.equal(headers['X-Content-Type-Options'],'nosniff');assert.equal(headers['X-Frame-Options'],'DENY');assert.equal(headers['Referrer-Policy'],'no-referrer');assert(config.routes.some(r=>r.status===404&&r.dest==='/404.html'));
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
for(const file of walk('public')){
 assert(!/\.(?:env|pem|key|sql|csv|log)$/i.test(file),'Arquivo privado na pasta pública');
 if(!/\.(?:html|js|json)$/i.test(file))continue;
 const s=fs.readFileSync(file,'utf8');assert(!/(?:postgres(?:ql)?:\/\/[^\s"']+|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{25,})/.test(s),'Possível segredo em arquivo público');
}
for(const store of stores){const s=fs.readFileSync('public/'+store.id+'/pedido.html','utf8');assert(!s.includes('googletagmanager.com'),'Analytics não deve carregar em formulário de pedido');}
console.log('Cadastro, destinos, cabeçalhos e arquivos públicos verificados. '+stores.length+' vitrines de demonstração; contatos ainda não homologados para clientes reais.');
