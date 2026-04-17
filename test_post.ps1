$wc = New-Object System.Net.WebClient
$wc.Headers['Content-Type'] = 'application/x-www-form-urlencoded'
$data = 'name=%E6%B5%8B%E8%AF%95%E4%B9%A6%E7%B1%BB&author=%E6%B5%8B%E8%AF%95%E4%BD%9C%E8%80%85&publisher=%E6%B5%8B%E8%AF%95%E5%87%91%E7%89%88%E7%A4%BE&isbn=1234567890&major=%E8%AE%A1%E7%AE%97%E6%9C%BA&condition=%E8%89%AF%E5%A5%BD&points=150&stock=5&status=LISTED'
try {
    $resp = $wc.UploadString('http://localhost:8080/api/admin/books', 'POST', $data)
    Write-Host 'SUCCESS:' $resp
} catch {
    Write-Host 'ERROR:' $_.Exception.Message
}
