let parkingData = [];
let map;
let markers = [];

async function loadParkingData() {
  try {
    const response = await fetch('data/parking.json');
    if (!response.ok) throw new Error('无法读取 parking.json');
    parkingData = await response.json();
    initFilters(parkingData);
    renderParking(parkingData);
    updateStats(parkingData);
    initMap(parkingData);
    renderRecommendations(parkingData.slice(0, 3).map(item => ({ item, score: 0, reasons: ['默认展示'] })));
  } catch (error) {
    document.getElementById('parkingList').innerHTML = '<p class="desc">车位数据加载失败，请检查 data/parking.json 文件。</p>';
    console.error(error);
  }
}

function initFilters(data) {
  const areaFilter = document.getElementById('areaFilter');
  const recArea = document.getElementById('recArea');
  const areas = [...new Set(data.map(item => item.area))];
  areas.forEach(area => {
    areaFilter.appendChild(new Option(area, area));
    recArea.appendChild(new Option(area, area));
  });
}

function initMap(data) {
  map = L.map('mapView').setView([23.1291, 113.2644], 10);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
  drawMarkers(data);
}

function drawMarkers(data) {
  markers.forEach(marker => marker.remove());
  markers = [];
  data.forEach(item => {
    const marker = L.marker([item.lat, item.lng]).addTo(map);
    marker.bindPopup(`<strong>${item.name}</strong><br>${item.area}<br>¥${item.monthlyPrice}/月起<br>剩余：${item.availableSpaces}位`);
    markers.push(marker);
  });
}

function renderParking(data) {
  const list = document.getElementById('parkingList');
  if (!data.length) {
    list.innerHTML = '<p class="desc">暂无符合条件的车位。</p>';
    return;
  }
  list.innerHTML = data.map(item => `
    <article class="parking-card">
      <div class="card-top">
        <div>
          <h3>${item.name}</h3>
          <div class="meta">
            <span class="pill">${item.area}</span>
            <span class="pill">${item.type}</span>
            <span class="pill">${item.security}</span>
          </div>
        </div>
        <span class="status ${item.status === '紧张' ? 'tight' : ''}">${item.status}</span>
      </div>
      <div class="price">¥${item.monthlyPrice}/月起</div>
      <p class="desc">剩余车位：${item.availableSpaces} 个</p>
      <p class="desc">适合：${item.suitableFor}</p>
      <p class="desc">${item.description}</p>
      <div class="feature-list">${(item.features || []).map(f => `<span>${f}</span>`).join('')}</div>
      <div class="card-actions">
        <a class="consult" href="#lead">提交需求</a>
        <a class="outline" href="tel:13800000000">电话咨询</a>
      </div>
    </article>
  `).join('');
}

function updateStats(data) {
  document.getElementById('parkingCount').textContent = data.length;
  document.getElementById('spaceCount').textContent = data.reduce((sum, item) => sum + Number(item.availableSpaces || 0), 0);
  document.getElementById('areaCount').textContent = new Set(data.map(item => item.area)).size;
  document.getElementById('minPrice').textContent = data.length ? `¥${Math.min(...data.map(item => Number(item.monthlyPrice)))}` : '¥0';
}

function applyFilters() {
  const area = document.getElementById('areaFilter').value;
  const price = document.getElementById('priceFilter').value;
  const keyword = document.getElementById('searchInput').value.trim();
  const availableOnly = document.getElementById('availableOnly').checked;

  const filtered = parkingData.filter(item => {
    const matchArea = area === 'all' || item.area === area;
    const matchPrice = price === 'all' || item.monthlyPrice <= Number(price);
    const matchAvailable = !availableOnly || item.status !== '已满';
    const matchKeyword = !keyword || item.name.includes(keyword) || item.area.includes(keyword) || item.type.includes(keyword) || item.suitableFor.includes(keyword);
    return matchArea && matchPrice && matchAvailable && matchKeyword;
  });

  renderParking(filtered);
  updateStats(filtered);
  if (map) drawMarkers(filtered);
}

function recommend() {
  const area = document.getElementById('recArea').value;
  const budget = Number(document.getElementById('recBudget').value || 999999);
  const needIndoor = document.getElementById('recIndoor').checked;
  const needAirport = document.getElementById('recAirport').checked;
  const needLongTerm = document.getElementById('recLongTerm').checked;

  const ranked = parkingData.map(item => {
    let score = 0;
    const reasons = [];
    if (area === 'all' || item.area === area) { score += 30; reasons.push('区域匹配'); }
    if (item.monthlyPrice <= budget) { score += 25; reasons.push('价格在预算内'); }
    if (item.availableSpaces > 0) { score += 20; reasons.push('仍有剩余车位'); }
    if (needLongTerm && item.longTerm) { score += 15; reasons.push('适合长期停放'); }
    if (needIndoor && item.indoor) { score += 10; reasons.push('满足室内停车需求'); }
    if (needAirport && item.airportNearby) { score += 10; reasons.push('满足机场周边需求'); }
    return { item, score, reasons };
  }).sort((a, b) => b.score - a.score).slice(0, 3);

  renderRecommendations(ranked);
}

function renderRecommendations(results) {
  const box = document.getElementById('recommendResults');
  box.innerHTML = results.map(({ item, score, reasons }, index) => `
    <div class="recommend-card">
      <div class="score">${score || '—'}分</div>
      <h3>${index + 1}. ${item.name}</h3>
      <p>${item.area} · ¥${item.monthlyPrice}/月起 · 剩余${item.availableSpaces}位</p>
      <p>推荐理由：${reasons.join('、')}</p>
    </div>
  `).join('');
}

function getValue(id) { return document.getElementById(id).value || '未填写'; }

function copyDemandInfo() {
  const lead = {
    name: getValue('leadName'),
    phone: getValue('leadPhone'),
    wechat: getValue('leadWechat'),
    area: getValue('leadArea'),
    vehicle: getValue('leadCar'),
    duration: getValue('leadDuration'),
    budget: getValue('leadBudget'),
    notes: getValue('leadNote')
  };
  localStorage.setItem('gzParkingLead', JSON.stringify(lead));
  const text = `停车需求：\n姓名：${lead.name}\n手机号：${lead.phone}\n微信号：${lead.wechat}\n停车区域：${lead.area}\n车型：${lead.vehicle}\n停放时长：${lead.duration}\n预算范围：${lead.budget}\n备注：${lead.notes}`;
  navigator.clipboard.writeText(text).then(() => alert('已复制需求信息，可以发送给微信客服。'));
}

function loadLastLead() {
  const raw = localStorage.getItem('gzParkingLead');
  if (!raw) return alert('暂无本地记录');
  const lead = JSON.parse(raw);
  document.getElementById('leadName').value = lead.name || '';
  document.getElementById('leadPhone').value = lead.phone || '';
  document.getElementById('leadWechat').value = lead.wechat || '';
  document.getElementById('leadArea').value = lead.area || '';
  document.getElementById('leadCar').value = lead.vehicle || '';
  document.getElementById('leadDuration').value = lead.duration || '';
  document.getElementById('leadBudget').value = lead.budget || '';
  document.getElementById('leadNote').value = lead.notes || '';
}

function clearLastLead() {
  localStorage.removeItem('gzParkingLead');
  alert('本地记录已清空');
}

document.getElementById('areaFilter').addEventListener('change', applyFilters);
document.getElementById('priceFilter').addEventListener('change', applyFilters);
document.getElementById('availableOnly').addEventListener('change', applyFilters);
document.getElementById('searchInput').addEventListener('input', applyFilters);
document.getElementById('recommendBtn').addEventListener('click', recommend);
document.getElementById('copyDemandBtn').addEventListener('click', copyDemandInfo);
document.getElementById('loadLastLead').addEventListener('click', loadLastLead);
document.getElementById('clearLastLead').addEventListener('click', clearLastLead);
document.getElementById('copyWechat').addEventListener('click', () => {
  navigator.clipboard.writeText(document.getElementById('wechatId').textContent).then(() => alert('微信号已复制'));
});

loadParkingData();
