(function(){
  var d=document;
  var $=function(s,r){return (r||d).querySelector(s)};
  var $$=function(s,r){return Array.prototype.slice.call((r||d).querySelectorAll(s))};
  var norm=function(s){return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')};
  var escH=function(s){return s.replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
  var HOY=new Date(); HOY.setHours(0,0,0,0);
  var views=$$('.view'), nav=$('#nav'), menuBtn=$('#menuBtn'), sp=$('#searchPanel'), q=$('#q'), searchBtn=$('#searchBtn');
  var first=true;

  function toast(msg){var t=d.createElement('div');t.className='toast';t.setAttribute('role','status');t.textContent=msg;d.body.appendChild(t);setTimeout(function(){t.remove()},2200)}
  function selectNode(n){var r=d.createRange();r.selectNodeContents(n);var s=getSelection();s.removeAllRanges();s.addRange(r)}
  function copyText(text,node){
    var fallback=function(){if(node){selectNode(node);toast('Texto seleccionado: copialo con Ctrl+C')}else toast('No se pudo copiar')};
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(function(){toast('Copiado')}).catch(fallback)}else fallback();
  }

  /* ---------- navegación entre vistas ---------- */
  function closeMenu(){nav.classList.remove('open');menuBtn.setAttribute('aria-expanded','false')}
  function closeSearch(){sp.hidden=true;searchBtn.setAttribute('aria-expanded','false')}
  function openSearch(){sp.hidden=false;searchBtn.setAttribute('aria-expanded','true');closeMenu();renderResults();q.focus();q.select()}
  function show(){
    var id='';
    try{id=decodeURIComponent(location.hash.slice(1))}catch(_){}
    if(!id)id='inicio';
    var target=d.getElementById(id), view=target&&target.closest('.view');
    if(!view){view=$('#no-encontrada');target=view}
    views.forEach(function(v){v.classList.toggle('on',v===view)});
    $$('a',nav).forEach(function(a){
      var on=a.getAttribute('href')==='#'+view.getAttribute('data-nav');
      a.classList.toggle('on',on);
      if(on)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
    });
    closeMenu();closeSearch();
    if(target.tagName==='DETAILS')target.open=true;
    if(target===view){
      window.scrollTo(0,0);
      if(!first){var h=$('h1',view);if(h){h.setAttribute('tabindex','-1');h.focus({preventScroll:true})}}
    }else{
      target.scrollIntoView();
    }
    first=false;
  }
  window.addEventListener('hashchange',show);
  menuBtn.addEventListener('click',function(){var o=nav.classList.toggle('open');menuBtn.setAttribute('aria-expanded',o);if(o)closeSearch()});

  /* ---------- buscador ---------- */
  var IDX=[];
  try{IDX=JSON.parse($('#idx').textContent)}catch(_){}
  function renderResults(){
    var box=$('#qres'), raw=q.value.trim(), term=norm(raw);
    $('#qhint').hidden=!!term;
    if(!term){box.innerHTML='';return}
    var toks=term.split(/\s+/);
    var score=function(e){var t=norm(e.t);return (t===term?8:0)+(t.indexOf(term)===0?4:0)+(t.indexOf(term)>-1?2:0)+(e.k.indexOf(term)>-1?1:0)};
    var hits=IDX.filter(function(e){
      if(!e.w)e.w=e.k.split(/[^a-z0-9]+/);
      return toks.every(function(t){return e.w.some(function(w){return w.indexOf(t)===0})});
    });
    hits.sort(function(a,b){return score(b)-score(a)});
    if(!hits.length){box.innerHTML='<p class="empty">No encontramos nada con «'+escH(raw)+'». Probá con otra palabra o <a href="#contacto">escribinos</a>.</p>';return}
    var max=14;
    box.innerHTML='<p class="rev">'+hits.length+(hits.length===1?' resultado':' resultados')+(hits.length>max?' · se muestran los primeros '+max:'')+'</p>'+
      hits.slice(0,max).map(function(e){return '<a class="res" href="'+e.h+'"><b>'+escH(e.t)+'</b><span>'+escH(e.s)+'</span></a>'}).join('');
  }
  searchBtn.addEventListener('click',function(){if(sp.hidden)openSearch();else closeSearch()});
  q.addEventListener('input',renderResults);
  q.addEventListener('keydown',function(e){if(e.key==='Enter'){var a=$('#qres a.res');if(a){e.preventDefault();a.click()}}});
  d.addEventListener('keydown',function(e){
    if(e.key==='Escape'&&!sp.hidden){closeSearch();searchBtn.focus()}
    else if(e.key==='/'&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!/^(INPUT|TEXTAREA|SELECT)$/.test(d.activeElement.tagName)){e.preventDefault();openSearch()}
  });

  /* ---------- filtros ---------- */
  function filterPubs(){
    var a=$('#fAnio').value,t=$('#fTipo').value,l=$('#fLinea').value,x=norm($('#fTexto').value.trim()),n=0,rows=$$('#pubList .pub');
    rows.forEach(function(r){
      var ok=(!a||r.getAttribute('data-anio')===a)&&(!t||r.getAttribute('data-tipo')===t)&&(!l||(' '+r.getAttribute('data-lineas')+' ').indexOf(' '+l+' ')>-1)&&(!x||r.getAttribute('data-txt').indexOf(x)>-1);
      r.hidden=!ok;if(ok)n++;
    });
    $('#pubCount').textContent=n+' de '+rows.length;
    $('#pubEmpty').hidden=n>0;
  }
  ['fAnio','fTipo','fLinea'].forEach(function(id){$('#'+id).addEventListener('change',filterPubs)});
  $('#fTexto').addEventListener('input',filterPubs);
  filterPubs();

  $$('[data-tema-f]').forEach(function(btn){btn.addEventListener('click',function(){
    var v=btn.getAttribute('data-tema-f'),n=0;
    $$('[data-tema-f]').forEach(function(b){b.setAttribute('aria-pressed',b===btn)});
    $$('#temaList .tema').forEach(function(r){var ok=!v||r.getAttribute('data-tipo')===v;r.hidden=!ok;if(ok)n++});
    $('#temaEmpty').hidden=n>0;
  })});

  /* ---------- convocatorias: las vencidas se ocultan solas ---------- */
  var abiertas=0;
  $$('#convList .conv').forEach(function(c){
    var p=c.getAttribute('data-cierre').split('-'), f=new Date(+p[0],p[1]-1,+p[2]);
    var dias=Math.round((f-HOY)/864e5);
    if(dias<0){c.hidden=true;return}
    abiertas++;
    var s=$('.falta',c);
    if(s)s.textContent=dias===0?' · cierra hoy':dias===1?' · cierra mañana':' · faltan '+dias+' días';
  });
  $$('[data-conv-count]').forEach(function(e){e.textContent=abiertas});
  $('#convEmpty').hidden=abiertas>0;

  /* ---------- clics delegados ---------- */
  d.addEventListener('click',function(e){
    var t=e.target;
    if(!sp.hidden&&!t.closest('header.site')&&!t.closest('[data-open-search]'))closeSearch();
    var el;
    if((el=t.closest('[data-skip]'))){e.preventDefault();var m=$('#contenido');m.focus({preventScroll:true});m.scrollIntoView();return}
    if((el=t.closest('[data-open-search]'))){openSearch();return}
    if((el=t.closest('[data-q]'))){q.value=el.getAttribute('data-q');renderResults();q.focus();return}
    if((el=t.closest('a.res'))){if(el.getAttribute('href')===location.hash){e.preventDefault();show()}return}
    if((el=t.closest('[data-copy]'))){copyText(el.getAttribute('data-copy'),$('code',el.parentElement));return}
    if((el=t.closest('[data-copy-prev]'))){var pre=el.previousElementSibling;copyText(pre.textContent,pre);return}
    if((el=t.closest('[data-motivo]'))){$('#cTipo').value=el.getAttribute('data-motivo');return}
  });

  /* ---------- formulario de ejemplo ---------- */
  $('#cform').addEventListener('submit',function(e){
    e.preventDefault();
    var ok=['cNombre','cMail','cMsg'].every(function(id){return $('#'+id).value.trim()});
    $('#cOut').textContent=ok?'Formulario de ejemplo: en el sitio real la consulta llegará al correo del grupo.':'Completá nombre, correo y mensaje para enviar la consulta.';
  });

  /* ---------- interruptores del modelo ---------- */
  function toggle(btnId,cls,key){
    var b=$('#'+btnId);
    var set=function(on){d.body.classList.toggle(cls,on);b.setAttribute('aria-pressed',on);try{localStorage.setItem(key,on?'1':'0')}catch(_){}};
    b.addEventListener('click',function(){set(!d.body.classList.contains(cls))});
    try{if(localStorage.getItem(key)==='1')set(true)}catch(_){}
  }
  toggle('notesBtn','notes','grsiNotes');
  toggle('maqBtn','maq-on','grsiMaq');

  show();
})();
