def test_get_dashboard_metrics(client):
    res = client.get("/api/analytics/dashboard")
    assert res.status_code == 200
    data = res.json()
    assert data["total_customers"] == 200
    assert data["total_documents"] >= 500
    assert "risk_distribution" in data

def test_customers_api(client):
    res = client.get("/api/customers?limit=10")
    assert res.status_code == 200
    assert len(res.json()) == 10

    # Get single customer
    single_res = client.get("/api/customers/CUS-000001")
    assert single_res.status_code == 200
    assert single_res.json()["id"] == "CUS-000001"

def test_documents_api(client):
    res = client.get("/api/documents?limit=10")
    assert res.status_code == 200
    assert len(res.json()) == 10

def test_evaluation_api(client):
    res = client.get("/api/analytics/evaluation")
    assert res.status_code == 200
    data = res.json()
    assert data["summary"]["recall"] == 1.0

def test_validation_api(client):
    res = client.get("/api/analytics/validation")
    assert res.status_code == 200
    assert res.json()["summary"]["total_checks"] == 12

def test_reproducibility_api(client):
    res = client.get("/api/analytics/reproducibility")
    assert res.status_code == 200
    assert res.json()["is_reproducible"] is True
