from flask import Flask, jsonify, request
from flask_cors import CORS 
import uuid 

app = Flask(__name__)
CORS(app) # Habilita CORS para todas as rotas

# "Banco de dados"

db_cartoes = {
    "nubank": {
        "info": {
            "id": "nubank",
            "nomeCompleto": "Nubank Mastercard Gold",
            "numeroMascarado": "**** **** **** 3456",
            "validade": "12/28",
            "logoImg": "https://logodownload.org/wp-content/uploads/2019/08/nubank-logo-1.png",
            "bandeiraImg": "https://upload.wikimedia.org/wikipedia/commons/0/04/Mastercard-logo.png",
            "corFundo": "linear-gradient(135deg, #820ad1, #a020f0)",
            "corTexto": "#FFFFFF"
        },
        "itens": [
            {"id": str(uuid.uuid4()), "tipo": "despesa", "descricao": "Cafeteria da Esquina", "valor": 15.75, "data": "2025-06-01"},
            {"id": str(uuid.uuid4()), "tipo": "despesa", "descricao": "Almoço Restaurante", "valor": 45.50, "data": "2025-06-02"},
            {"id": str(uuid.uuid4()), "tipo": "assinatura", "descricao": "Streaming de Música", "valor": 29.90, "dataInicio": "2025-01-15"},
            {"id": str(uuid.uuid4()), "tipo": "parcela", "descricao": "Celular Novo", "valor": 300.00, "dataCompra": "2025-05-10", "atual": 2, "total": 10},
        ]
    },
    "bb": {
        "info": {
            "id": "bb",
            "nomeCompleto": "Banco do Brasil Mastercard Gold",
            "numeroMascarado": "**** **** **** 7890",
            "validade": "10/27",
            "logoImg": "https://logospng.org/download/banco-inter/logo-banco-bb-2048.png",  
            "bandeiraImg": "https://upload.wikimedia.org/wikipedia/commons/0/04/Mastercard-logo.png",
            "corFundo": "linear-gradient(135deg,  #a1a108,  #FFFF00)",
            "corTexto": "#FFFFFF"
        },
        "itens": [
            {"id": str(uuid.uuid4()), "tipo": "despesa", "descricao": "Livraria", "valor": 85.00, "data": "2025-06-03"},
            {"id": str(uuid.uuid4()), "tipo": "assinatura", "descricao": "Streaming de Filmes", "valor": 45.90, "dataInicio": "2025-02-01"},
        ]
    },
    "caixa": {
        "info": {
            "id": "caixa",
            "nomeCompleto": "Caixa Econômica Federal Visa Platinum",
            "numeroMascarado": "**** **** **** 1234",
            "validade": "08/26",
            "logoImg": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Logo_Caixa_Econ%C3%B4mica_Federal.svg/1200px-Logo_Caixa_Econ%C3%B4mica_Federal.svg.png",
            "bandeiraImg": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Visa_Inc._logo.svg/1200px-Visa_Inc._logo.svg.png",
            "corFundo": "linear-gradient(135deg, #003DA5, #0056A1)",
            "corTexto": "#FFFFFF"
        },
        "itens": [
            {"id": str(uuid.uuid4()), "tipo": "despesa", "descricao": "Supermercado", "valor": 200.00, "data": "2025-06-04"},
            {"id": str(uuid.uuid4()), "tipo": "parcela", "descricao": "Compra de Eletrodoméstico", "valor": 150.00, "dataCompra": "2025-05-15", "atual": 1, "total": 5},
        ]
    }

}

@app.route('/api/cartoes/<string:cartao_id>', methods=['GET'])
def get_cartao_detalhes(cartao_id):
    if cartao_id not in db_cartoes:
        return jsonify({"erro": "Cartão não encontrado"}), 404

    cartao_data = db_cartoes[cartao_id]
    
    # Calcula totais dinamicamente
    total_despesas = 0
    total_assinaturas = 0
    total_parcelas = 0

    for item in cartao_data.get("itens", []):
        if item.get("tipo") == "despesa":
            total_despesas += item.get("valor", 0)
        elif item.get("tipo") == "assinatura":
            total_assinaturas += item.get("valor", 0)
        elif item.get("tipo") == "parcela":
            total_parcelas += item.get("valor", 0)
            
    total_geral = total_despesas + total_assinaturas + total_parcelas

    # Monta a resposta
    resposta = {
        **cartao_data.get("info", {}), # Inclui todas as infos do cartão
        "itens": cartao_data.get("itens", []),
        "totalDespesas": total_despesas,
        "totalAssinaturas": total_assinaturas,
        "totalParcelas": total_parcelas,
        "totalGeral": total_geral
    }
    return jsonify(resposta)

@app.route('/api/cartoes/<string:cartao_id>/itens', methods=['POST'])
def add_item_cartao(cartao_id):
    if cartao_id not in db_cartoes:
        return jsonify({"erro": "Cartão não encontrado"}), 404

    novo_item = request.json
    if not novo_item or not novo_item.get("tipo") or not novo_item.get("descricao") or novo_item.get("valor") is None:
        return jsonify({"erro": "Dados incompletos para o item"}), 400

    novo_item["id"] = str(uuid.uuid4()) # Gera um ID único
    
    db_cartoes[cartao_id].setdefault("itens", []).append(novo_item)
    
    return jsonify(novo_item), 201

@app.route('/api/cartoes/<string:cartao_id>/itens/<string:item_id>', methods=['DELETE'])
def delete_item_cartao(cartao_id, item_id):
    if cartao_id not in db_cartoes:
        return jsonify({"erro": "Cartão não encontrado"}), 404

    itens_cartao = db_cartoes[cartao_id].get("itens", [])
    item_encontrado = False
    for i, item in enumerate(itens_cartao):
        if item.get("id") == item_id:
            itens_cartao.pop(i)
            item_encontrado = True
            break
            
    if not item_encontrado:
        return jsonify({"erro": "Item não encontrado"}), 404
        
    return jsonify({"mensagem": "Item removido com sucesso"}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)