const $=s=>document.querySelector(s);
const MODELS={Toyota:['Corolla','Fortuner','Innova'],Hyundai:['Creta','i20','Verna'],Honda:['City','Amaze','Jazz'],Maruti:['Swift','Baleno','Dzire'],Mahindra:['XUV500','Scorpio','Thar'],Tata:['Nexon','Harrier','Tiago']};
const inr=n=>'₹'+Math.round(n).toLocaleString('en-IN');
const hist=()=>JSON.parse(localStorage.getItem('av_hist')||'[]');
const setHist=h=>localStorage.setItem('av_hist',JSON.stringify(h));
const NAV=[['dashboard','Dashboard','▦'],['predict','Predict Price','◎'],['analytics','Analytics','▮'],['history','History','↺'],['dataset','Dataset','▤'],['about','About','ⓘ']];
let last=null,tab='Price Trends',q='';
const opts=a=>a.map(x=>`<option>${x}</option>`).join('');
const YEARS=[2015,2016,2017,2018,2019,2020,2021,2022,2023],AVG=[3.4,3.3,3.9,4.5,4.2,5.1,5.4,5.0,7.2];

function line(xs,ys,max){const w=520,h=180,p=30,X=i=>p+i*(w-p-10)/(xs.length-1),Y=v=>h-p-(v/max)*(h-p-10);
 const pts=ys.map((v,i)=>`${X(i)},${Y(v)}`);
 return `<svg viewBox="0 0 ${w} ${h}" width="100%">${[0,1,2,3].map(i=>`<line x1="${p}" x2="${w-10}" y1="${Y(max*i/3)}" y2="${Y(max*i/3)}" stroke="#e5ebf4"/><text x="0" y="${Y(max*i/3)+3}">${(max*i/3).toFixed(0)}L</text>`).join('')}
 <path d="M${pts.join('L')}L${X(xs.length-1)},${h-p}L${p},${h-p}Z" fill="#2563eb" opacity=".08"/><path d="M${pts.join('L')}" fill="none" stroke="#2563eb" stroke-width="2"/>
 ${ys.map((v,i)=>`<circle cx="${X(i)}" cy="${Y(v)}" r="3" fill="#2563eb"/>`).join('')}${xs.map((x,i)=>i%2?'':`<text x="${X(i)-10}" y="${h-8}">${x}</text>`).join('')}</svg>`}
const stat=(i,l,v)=>`<div class="card stat"><span class="ico">${i}</span><div><small>${l}</small><b>${v}</b></div></div>`;
const side=r=>`<aside class="side"><div class="logo"><i>🚗</i>AutoValue AI</div>${NAV.map(([k,t,i])=>`<a href="#${k}" class="${k==r?'on':''}"><span>${i}</span>${t}</a>`).join('')}</aside>`;

const V={
home:()=>`<header class="top"><div class="logo"><i>🚗</i>AutoValue AI</div><nav><a href="#home">Home</a><a href="#dashboard">Dashboard</a><a href="#predict">Predict</a><a href="#analytics">Analytics</a><a href="#history">History</a><a href="#about">About</a></nav><a class="btn" href="#predict">Login</a></header>
 <section class="hero"><h1>Smart Car <span>Price</span> Prediction</h1><p>Get the estimated resale value of any used car using machine learning. Make better buying and selling decisions with data.</p><a class="btn" href="#predict">Predict Price →</a></section>
 <section class="features">${[['🚘','Accurate Predictions','Powered by ML models'],['◎','Multiple Features','Year, mileage, fuel, etc.'],['✎','Easy to Use','Simple and clean interface'],['↺','Save History','Track your predictions']].map(f=>`<div class="feat"><span class="ico">${f[0]}</span><b>${f[1]}</b><small>${f[2]}</small></div>`).join('')}</section>`,
dashboard:()=>{const h=hist(),avg=h.length?h.reduce((a,b)=>a+b.price,0)/h.length:0,f={};h.forEach(x=>f[x.fuel]=(f[x.fuel]||0)+1);
 const fs=[['Petrol',52,'#2563eb'],['Diesel',34,'#16a34a'],['CNG',14,'#f97316']];
 return `<h2>Dashboard</h2><p class="sub">Overview of your car price prediction system</p>
 <div class="grid g4">${stat('▦','Total Predictions',h.length)}${stat('₹','Average Predicted Price',avg?inr(avg):'—')}${stat('⚙','Models Trained',1)}${stat('◷','Last Prediction',h[0]?h[0].date:'—')}</div><br>
 <div class="grid g21"><div class="card"><h3>Price Trend Over Years</h3>${line(YEARS,AVG,12)}</div>
 <div class="card"><h3>Fuel Type Distribution</h3><div class="donut" style="background:conic-gradient(#2563eb 0 52%,#16a34a 0 86%,#f97316 0)"></div><div class="legend" style="margin-top:14px">${fs.map(x=>`<div><span><i class="dot" style="background:${x[2]}"></i>${x[0]}</span><b>${x[1]}%</b></div>`).join('')}</div></div></div>
 <div class="card"><h3>Recent Predictions</h3>${table(h.slice(0,3))}</div>`},
predict:()=>`<h2>Predict Car Price</h2><p class="sub">Enter the details of the car to get an estimated selling price</p><div class="card"><form id="f"><div class="form">
 <div><label>Brand</label><select id="brand">${opts(Object.keys(MODELS))}</select></div><div><label>Model</label><select id="model"></select></div>
 <div><label>Year of Purchase</label><select id="year">${opts([...Array(26)].map((_,i)=>2025-i))}</select></div><div><label>Kilometres Driven</label><input id="km" type="number" min="0" value="45000" required></div>
 <div><label>Fuel Type</label><select id="fuel">${opts(['Petrol','Diesel','CNG'])}</select></div><div><label>Transmission</label><select id="trans">${opts(['Manual','Automatic'])}</select></div>
 <div><label>Engine Size (CC)</label><input id="engine" type="number" min="600" value="1500" required></div><div><label>Owner Type</label><select id="owner"><option value="First">First Owner</option><option value="Second">Second Owner</option><option value="Third">Third Owner</option></select></div>
 <div><label>Car Condition</label><select id="cond">${opts(['Good','Excellent','Average','Poor'])}</select></div></div>
 <button class="btn full" id="go">Get Estimated Price</button></form></div>`,
result:()=>{const c=last;return `<h2>Estimated Selling Price</h2><br><div class="card price"><span class="ico">₹</span><div><b>${inr(c.price)}</b><small>Estimated market value${c.offline?' (offline estimate)':''}</small></div></div>
 <div class="card"><h3>Car Details</h3><div class="kv">${[['Brand',c.brand],['Model',c.model],['Year',c.year],['Kilometres Driven',c.km],['Fuel Type',c.fuel],['Transmission',c.trans],['Engine Size',c.engine+' CC'],['Owner Type',c.owner+' Owner'],['Condition',c.cond]].map(([k,v])=>`<span>${k}</span><span>${v}</span>`).join('')}</div>
 <div class="note">ⓘ This is an estimated price based on market data and may vary based on location, condition and other factors.</div>
 <div class="row"><button class="btn" id="sv">Save to History</button><a class="btn ghost" href="#predict">Predict Another Car</a></div></div>`},
analytics:()=>{const T=['Price Trends','Fuel Type','Mileage','Model Comparison'];let b;
 if(tab=='Price Trends')b=`<h3>Average Price by Year</h3>${line(YEARS,AVG,12)}`;
 else if(tab=='Fuel Type')b=`<h3>Average Price by Fuel (L)</h3><div class="bars">${[['Petrol',6.8,'#2563eb'],['Diesel',8.2,'#16a34a'],['CNG',5.1,'#f97316']].map(x=>`<div style="height:${x[1]*16}px;background:${x[2]}"><em>${x[1]}L</em></div>`).join('')}</div><div class="bars" style="height:auto;margin-top:6px;color:#6b7a90;font-size:12px"><span style="width:48px;text-align:center">Petrol</span><span style="width:48px;text-align:center">Diesel</span><span style="width:48px;text-align:center">CNG</span></div>`;
 else if(tab=='Mileage')b=`<h3>Average Price by Kilometres Driven (L)</h3>${line(['0-20k','20-40k','40-60k','60-80k','80-100k','100k+'],[9,7.4,6,4.8,3.6,2.4],12)}`;
 else b=`<h3>Model Performance</h3><table><tr><th>Model</th><th>R² Score</th></tr><tr><td>Random Forest</td><td style="color:var(--green);font-weight:600">Paste your train.py Test R²</td></tr></table>`;
 return `<h2>Analytics</h2><p class="sub">Explore insights from your car data (sample values – replace with your dataset stats)</p><div class="card"><div class="tabs">${T.map(t=>`<button class="${t==tab?'on':''}" data-t="${t}">${t}</button>`).join('')}</div>${b}</div>`},
history:()=>{const h=hist().filter(x=>(x.brand+x.model).toLowerCase().includes(q));
 return `<div class="row" style="justify-content:space-between;align-items:center"><div><h2>Prediction History</h2><p class="sub">View and manage your past predictions</p></div><input id="q" placeholder="Search by brand or model..." value="${q}" style="max-width:260px"></div>
 <div class="card">${table(h,true)}<div class="row" style="justify-content:space-between;align-items:center;margin-top:14px"><small style="color:var(--mut)">Showing ${h.length} entries</small><button class="btn ghost" id="exp">⬇ Export CSV</button></div></div>`},
dataset:()=>`<h2>Dataset</h2><p class="sub">Upload and inspect your car dataset</p><div class="card drop">☁<br>Drag & drop a CSV file here or<br><br><label class="btn" style="margin:0">Choose File<input id="file" type="file" accept=".csv" hidden></label></div><div id="info"></div>`,
about:()=>`<h2>About This Project</h2><p class="sub">Car Price Prediction using Machine Learning</p><div class="grid g2"><div class="card"><h3>Problem Statement</h3><p style="line-height:1.6;color:#44536b">Predict the resale price of a car from its features, helping buyers and sellers make decisions with accurate price estimation.</p><h3 style="margin-top:16px">Objectives</h3><ul style="padding-left:18px;line-height:1.9;color:#44536b"><li>Build an ML model to predict selling price</li><li>Handle missing values and categorical data</li><li>Use Random Forest with a train/test evaluation</li><li>Provide a simple, user-friendly web interface</li></ul></div>
 <div class="card"><h3>Methodology</h3>${[['Data Preprocessing','Clean data, impute missing values, encode'],['Train/Test Split','80% training, 20% testing'],['Model Training','Random Forest Regressor'],['Evaluation','MAE, RMSE, R²']].map((s,i)=>`<div class="step"><b>${i+1}</b><div><b style="all:unset;font-weight:600">${s[0]}</b><br><small style="color:var(--mut)">${s[1]}</small></div></div>`).join('')}<h3 style="margin-top:16px">Technology Stack</h3><p style="color:#44536b">Python · Flask · Pandas · Scikit-learn · HTML/CSS/JS</p></div></div>`};

function table(h,act){if(!h.length)return '<p style="color:var(--mut);padding:10px">No predictions yet. Predict a car price to see it here.</p>';
 return `<table><tr><th>#</th><th>Brand</th><th>Model</th><th>Year</th><th>Predicted Price</th><th>Date</th>${act?'<th>Actions</th>':''}</tr>${h.map((x,i)=>`<tr><td>${i+1}</td><td>${x.brand}</td><td>${x.model}</td><td>${x.year}</td><td>${inr(x.price)}</td><td>${x.date}</td>${act?`<td><button class="x" data-d="${i}" aria-label="Delete">🗑</button></td>`:''}</tr>`).join('')}</table>`}

function offline(c){const age=2025-c.year,m=(o,k)=>o[k];
 const p=(150000+c.engine*450)*Math.pow(.9,age)*m({Petrol:1,Diesel:1.12,CNG:.95},c.fuel)*m({First:1,Second:.88,Third:.75},c.owner)*m({Poor:.8,Average:.92,Good:1,Excellent:1.1},c.cond)-c.km*.6;return Math.max(30000,Math.round(p/1000)*1000)}

function bind(r){
 if(r=='predict'){const b=$('#brand'),m=$('#model');const fill=()=>m.innerHTML=opts(MODELS[b.value]);b.onchange=fill;fill();
  $('#f').onsubmit=async e=>{e.preventDefault();$('#go').textContent='Estimating...';
   const c={brand:b.value,model:m.value,year:+$('#year').value,km:+$('#km').value,fuel:$('#fuel').value,trans:$('#trans').value,engine:+$('#engine').value,owner:$('#owner').value,cond:$('#cond').value};
   try{const r=await fetch('/api/predict',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(c)});if(!r.ok)throw 0;c.price=(await r.json()).price}
   catch{c.price=offline(c);c.offline=true}
   c.date=new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});last=c;location.hash='result'}}
 if(r=='result')$('#sv').onclick=e=>{const h=hist();h.unshift(last);setHist(h);e.target.textContent='Saved ✓'};
 if(r=='analytics')document.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{tab=b.dataset.t;render()});
 if(r=='history'){$('#q').oninput=e=>{q=e.target.value.toLowerCase();render();const i=$('#q');i.focus();i.setSelectionRange(99,99)};
  document.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{const h=hist();h.splice(+b.dataset.d,1);setHist(h);render()});
  $('#exp').onclick=()=>{const rows=['brand,model,year,price,date',...hist().map(x=>[x.brand,x.model,x.year,x.price,x.date].join(','))];const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([rows.join('\n')],{type:'text/csv'}));a.download='history.csv';a.click()}}
 if(r=='dataset')$('#file').onchange=e=>{const f=e.target.files[0];if(!f)return;f.text().then(t=>{
  const L=t.trim().split(/\r?\n/),sp=s=>s.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/),H=sp(L[0]),R=L.slice(1).map(sp);
  const cols=H.map((n,i)=>{const v=R.map(r=>(r[i]||'').trim()),ok=v.filter(Boolean);return{n,miss:v.length-ok.length,t:ok.length&&ok.every(x=>!isNaN(x))?'numeric':'object'}});
  $('#info').innerHTML=`<div class="grid g2"><div class="card"><h3>Dataset Info</h3><div class="kv"><span>File Name</span><span>${f.name}</span><span>Total Rows</span><span>${R.length}</span><span>Total Columns</span><span>${H.length}</span><span>Missing Values</span><span>${cols.reduce((a,c)=>a+c.miss,0)}</span></div></div>
  <div class="card"><h3>Missing Values</h3><table><tr><th>Column</th><th>Missing Count</th></tr>${cols.filter(c=>c.miss).map(c=>`<tr><td>${c.n}</td><td>${c.miss}</td></tr>`).join('')||'<tr><td colspan=2>None</td></tr>'}</table></div></div>
  <div class="card"><h3>Columns</h3><table><tr><th>Column Name</th><th>Data Type</th></tr>${cols.map(c=>`<tr><td>${c.n}</td><td>${c.t}</td></tr>`).join('')}</table></div>`})}
}
function render(){const r=location.hash.slice(1)||'home';let v=r;
 if(r=='result'&&!last){location.hash='predict';return}
 if(!V[v])v='home';
 $('#app').innerHTML=v=='home'?V.home():`<div class="shell">${side(v=='result'?'predict':v)}<div><div class="main"><div class="bar">👤 User</div>${V[v]()}</div></div></div>`;
 window.scrollTo(0,0);bind(v)}
addEventListener('hashchange',render);render();