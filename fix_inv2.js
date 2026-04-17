const fs = require('fs');
const path = 'C:/Users/Administrator/IdeaProjects/LL/src/main/resources/static/admin/inventory-all.html';
let c = fs.readFileSync(path, 'utf8');

// 1. Add 新增入库 button after search button
c = c.replace(
    '<button class="btn-primary" onclick="searchInventoryTable()">🔍 搜索</button>\r\n        </div>',
    '<button class="btn-primary" onclick="searchInventoryTable()">🔍 搜索</button>\r\n            <button class="btn-secondary" onclick="openStockInModal()">+ 新增入库</button>\r\n        </div>'
);

// 2. Fix table headers: 教材名称/ISBN/数量/时间/经手人 (5 cols)
c = c.replace(
    '            <th>教材名称</th>\r\n            <th>ISBN</th>\r\n            <th>库存数量</th>\r\n            <th>更新时间</th>',
    '            <th>教材名称</th>\r\n            <th>ISBN</th>\r\n            <th>数量</th>\r\n            <th>时间</th>\r\n            <th>经手人</th>'
);

fs.writeFileSync(path, c, 'utf8');
console.log('Done');
