/* Deal Dhamaka payment import and UPI queue. Payments are stored in the app's
   existing activity array so the existing backup/cloud bridge can carry them. */
(() => {
"use strict";
const DATA_KEY="dealDhamakaAgentV2", $=id=>document.getElementById(id);
const norm=v=>String(v??"").trim().toLowerCase().replace(/\s+/g," ");
const money=v=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(Number(v)||0);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let selected=new Set();
function data(){try{return JSON.parse(localStorage.getItem(DATA_KEY)||"{}")}catch(_){return {}}}
function rows(){return (data().activity||[]).filter(a=>a?.type==="dd_payment"&&a.payment).map(a=>a.payment)}
function contacts(){return data().contacts||[]}
function persist(list){
 const d=data(), other=(d.activity||[]).filter(a=>a?.type!=="dd_payment");
 d.activity=other.concat(list.map(x=>({id:"payment-"+x.id,type:"dd_payment",payment:x,time:Date.now()})));
 localStorage.setItem(DATA_KEY,JSON.stringify(d));
 window.dispatchEvent(new Event("deal-dhamaka-data-updated"));
}
function render(){
 const all=rows(), filter=$("paymentFilter")?.value||"all", query=norm($("paymentSearch")?.value);
 const pending=all.filter(x=>x.status!=="Paid"), paid=all.filter(x=>x.status==="Paid");
 $("paymentPendingTotal").textContent=money(pending.reduce((s,x)=>s+Number(x.amount||0),0));
 $("paymentPendingCount").textContent=pending.length;
 $("paymentPaidTotal").textContent=money(paid.reduce((s,x)=>s+Number(x.amount||0),0));
 $("paymentUnmatchedCount").textContent=all.filter(x=>!x.contactId).length;
 const list=all.filter(x=>{
  const match=filter==="all"||(filter==="pending"&&x.status!=="Paid")||(filter==="paid"&&x.status==="Paid")||(filter==="unmatched"&&!x.contactId);
  return match&&(!query||norm([x.contactName,x.productName,x.remarks].join(" ")).includes(query));
 });
 $("paymentQueue").innerHTML=list.length?list.map(x=>`
 <div class="item payment-row">
  <label style="display:flex;gap:10px;align-items:flex-start">
   <input type="checkbox" data-pay-select="${esc(x.id)}" ${selected.has(x.id)?"checked":""}>
   <span><b>${esc(x.contactName)}</b><br><small>${esc(x.productName||"Payment")} · ${esc(x.remarks||"")}</small><br><small>UPI: ${esc(x.upiId||"Missing — edit contact")}</small><br><b>${money(x.amount)}</b> · ${esc(x.status)}</span>
  </label>
  <div class="payment-actions">
   ${x.status!=="Paid"?`<button class="primary" type="button" data-pay-one="${esc(x.id)}" ${!x.upiId?"disabled":""}>Pay</button><button class="secondary" type="button" data-mark-paid="${esc(x.id)}">Mark paid</button>`:`<small>Paid ${esc(x.paidAt||"")}</small>`}
  </div>
 </div>`).join(""):'<p class="hint">No payment rows match this filter.</p>';
 $("paymentQueue").querySelectorAll("[data-pay-select]").forEach(e=>e.onchange=()=>{e.checked?selected.add(e.dataset.paySelect):selected.delete(e.dataset.paySelect);});
 $("paymentQueue").querySelectorAll("[data-pay-one]").forEach(e=>e.onclick=()=>pay([e.dataset.payOne]));
 $("paymentQueue").querySelectorAll("[data-mark-paid]").forEach(e=>e.onclick=()=>markPaid([e.dataset.markPaid]));
}
function pay(ids){
 const chosen=rows().filter(x=>ids.includes(x.id)&&x.status!=="Paid"); if(!chosen.length)return;
 if(chosen.some(x=>!x.contactId)){alert("Match this payment to a saved contact before paying.");return;}
 const contactIds=[...new Set(chosen.map(x=>String(x.contactId)))];
 if(contactIds.length!==1){alert("Select payment rows for one contact at a time.");return;}
 const c=contacts().find(x=>String(x.id)===contactIds[0]), upi=String(c?.upiId||chosen[0].upiId||"").trim();
 if(!upi||! /^[^@\s]+@[^@\s]+$/.test(upi)){alert("Add a valid UPI ID to this contact first.");return;}
 const amount=chosen.reduce((s,x)=>s+Number(x.amount||0),0);
 if(!(amount>0)){alert("Payment amount must be greater than zero.");return;}
 const note=chosen.map(x=>x.productName||x.remarks||"Deal Dhamaka payment").join(", ").slice(0,80);
 const uri="upi://pay?"+new URLSearchParams({pa:upi,pn:c?.name||chosen[0].contactName,am:amount.toFixed(2),cu:"INR",tn:note});
 if(!confirm(`Open your UPI app for ${money(amount)} to ${c?.name||chosen[0].contactName} (${upi})? Verify recipient and amount in the UPI app before authorising.`))return;
 location.href=uri;
}
function markPaid(ids){
 if(!confirm("Mark these entries paid only after confirming success in your bank/UPI app?"))return;
 persist(rows().map(x=>ids.includes(x.id)?{...x,status:"Paid",paidAt:new Date().toISOString()}:x));
 ids.forEach(x=>selected.delete(x));render();
}
function importRows(records,fileName){
 const cs=contacts(), old=rows(), added=[], unmatched=[];
 records.forEach((r,i)=>{
  const get=(...names)=>{const k=Object.keys(r).find(key=>names.some(n=>norm(n)===norm(key)));return k?String(r[k]??"").trim():"";};
  const name=get("Contact Name","Name","Contact","Recipient","Customer");
  const amount=Number(get("Pending Amount","Amount","Payment Amount","Payable Amount").replace(/[₹,\s]/g,""));
  if(!name||!Number.isFinite(amount)||amount<=0)return;
  const c=cs.find(x=>norm(x.name)===norm(name));
  if(!c)unmatched.push(name);
  added.push({id:`pay-${Date.now()}-${i}-${Math.random().toString(36).slice(2,7)}`,contactId:c?.id||"",contactName:name,upiId:c?.upiId||"",productName:get("Product Name","Product","Item"),amount,remarks:get("Remarks","Description","Narration"),status:"Pending",importedAt:new Date().toISOString(),sourceFile:fileName});
 });
 if(!added.length){$("paymentImportStatus").textContent="No valid rows found. Required columns: Contact Name and Pending Amount.";return;}
 persist(old.concat(added));
 $("paymentImportStatus").textContent=`Imported ${added.length} payment rows. Unmatched contacts: ${[...new Set(unmatched)].join(", ")||"None"}.`;
 render();
}
async function importFile(){
 const f=$("paymentExcelFile").files[0];if(!f){alert("Choose an Excel or CSV file first.");return;}
 try{
  if(/\.csv$/i.test(f.name)){
   const text=await f.text(), lines=text.split(/\r?\n/).filter(Boolean);
   const parse=line=>{const out=[];let v="",q=false;for(let i=0;i<line.length;i++){const ch=line[i];if(ch==='"'&&line[i+1]==='"'){v+='"';i++;}else if(ch==='"')q=!q;else if(ch===","&&!q){out.push(v);v="";}else v+=ch;}out.push(v);return out;};
   const heads=parse(lines.shift()).map(x=>x.replace(/^\uFEFF/,"").trim());
   importRows(lines.map(l=>Object.fromEntries(parse(l).map((v,i)=>[heads[i],v]))),f.name);
  }else{
   if(!window.XLSX)throw Error("Excel reader did not load. Reload the page or import a CSV.");
   const wb=XLSX.read(await f.arrayBuffer(),{type:"array"}), ws=wb.Sheets[wb.SheetNames[0]];
   importRows(XLSX.utils.sheet_to_json(ws,{defval:""}),f.name);
  }
 }catch(e){$("paymentImportStatus").textContent="Import failed: "+e.message;}
}
function exportCsv(){
 const head=["Contact Name","UPI ID","Product Name","Pending Amount","Remarks","Status","Paid At","Imported At"];
 const lines=[head,...rows().map(x=>[x.contactName,x.upiId,x.productName,x.amount,x.remarks,x.status,x.paidAt,x.importedAt])].map(row=>row.map(v=>'"'+String(v??"").replace(/"/g,'""')+'"').join(",")).join("\r\n");
 const a=document.createElement("a"),u=URL.createObjectURL(new Blob([lines],{type:"text/csv;charset=utf-8"}));a.href=u;a.download="deal-dhamaka-payment-register.csv";a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);
}
window.renderPayments=render;
document.addEventListener("DOMContentLoaded",()=>{
 if(!$("payments"))return;
 $("paymentImportBtn").addEventListener("click",importFile);
 $("paymentExportBtn").addEventListener("click",exportCsv);
 $("paymentFilter").addEventListener("change",render);
 $("paymentSearch").addEventListener("input",render);
 const b=document.createElement("button");b.id="paySelectedBtn";b.className="primary full";b.type="button";b.textContent="Pay selected together (same contact)";b.addEventListener("click",()=>pay([...selected]));
 $("paymentQueue").before(b);render();
});
window.addEventListener("deal-dhamaka-data-updated",render);
})();
