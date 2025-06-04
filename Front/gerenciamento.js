document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://127.0.0.1:5000/api';
    let idCartaoAtual = null;

    // Elementos DOM
    const elCartaoDetalhes = document.getElementById('cartaoDetalhesContainer');
    const elTotalDespesas = document.getElementById('total-despesas');
    const elTotalAssinaturas = document.getElementById('total-assinaturas');
    const elTotalParcelas = document.getElementById('total-parcelas');
    const elTotalGeral = document.getElementById('total-geral');
    const elListaDespesas = document.getElementById('lista-despesas');
    const elListaAssinaturas = document.getElementById('lista-assinaturas');
    const elListaParcelas = document.getElementById('lista-parcelas');

    // Função Principal para Carregar, Renderizar e Lidar com Ações
    async function gerenciarCartao(acao = 'carregar', tipoOuItemId = null) {
        if (!idCartaoAtual && acao !== 'inicializar') { // 'inicializar' é um pseudo-estado para pegar o ID
             if(elCartaoDetalhes) elCartaoDetalhes.innerHTML = `<p class="placeholder-mensagem erro">ID do cartão não definido.</p>`;
            return;
        }

        let url = `${API_BASE_URL}/cartoes/${idCartaoAtual}`;
        let options = { method: 'GET', headers: {} }; // Default para carregar

        if (acao === 'adicionarItem') {
            options.method = 'POST';
            options.headers['Content-Type'] = 'application/json';
            url += '/itens';

            const hoje = new Date().toISOString().split('T')[0];
            const dadosItem = { tipo: tipoOuItemId }; // tipoOuItemId é o 'tipo' do item
            
            dadosItem.descricao = prompt(`Descrição para ${dadosItem.tipo}:`);
            if (!dadosItem.descricao) return; // Usuário cancelou
            
            const valorStr = prompt(`Valor (Ex: 50.25):`);
            if (!valorStr) return;
            dadosItem.valor = parseFloat(valorStr.replace(',', '.'));
            if (isNaN(dadosItem.valor) || dadosItem.valor <= 0) { alert("Valor inválido."); return; }

            if (dadosItem.tipo === 'despesa') dadosItem.data = prompt("Data (AAAA-MM-DD):", hoje);
            else if (dadosItem.tipo === 'assinatura') dadosItem.dataInicio = prompt("Data de início (AAAA-MM-DD):", hoje);
            else if (dadosItem.tipo === 'parcela') {
                dadosItem.dataCompra = prompt("Data da compra (AAAA-MM-DD):", hoje);
                dadosItem.atual = parseInt(prompt("Parcela atual:", "1"));
                dadosItem.total = parseInt(prompt("Total de parcelas:", "12"));
                if (isNaN(dadosItem.atual) || isNaN(dadosItem.total) || dadosItem.atual <= 0 || dadosItem.total < dadosItem.atual) {
                    alert("Dados da parcela inválidos."); return;
                }
            }
            if ((dadosItem.tipo === 'despesa' && !dadosItem.data) || (dadosItem.tipo === 'assinatura' && !dadosItem.dataInicio) || (dadosItem.tipo === 'parcela' && !dadosItem.dataCompra)) {
                 alert("Data não fornecida."); return;
            }
            options.body = JSON.stringify(dadosItem);

        } else if (acao === 'removerItem') {
            if (!confirm("Tem certeza que deseja excluir este item?")) return;
            options.method = 'DELETE';
            url += `/itens/${tipoOuItemId}`; // tipoOuItemId é o 'itemId'
        }

        // Se a ação não for de modificar, ou após uma modificação, sempre carregamos e renderizamos
        // Para 'carregar' ou após 'adicionarItem'/'removerItem' (que precisam recarregar)
        try {
            if (acao !== 'inicializar') { // Não faz fetch se for só para pegar o ID
                const response = await fetch(url, options);
                if (!response.ok) {
                    const errorBody = await response.text(); // Tenta pegar mais detalhes do erro
                    throw new Error(`Erro ${response.status}: ${response.statusText}. Detalhes: ${errorBody}`);
                }
                // Se for POST ou DELETE bem-sucedido, precisamos recarregar os dados do cartão
                // Se for GET (carregar), os dados já virão na response.
                if (options.method === 'POST' || options.method === 'DELETE') {
                    // Após adicionar ou remover, faz um GET para pegar o estado atualizado
                    const getResponse = await fetch(`${API_BASE_URL}/cartoes/${idCartaoAtual}`);
                    if (!getResponse.ok) throw new Error(`Erro ao recarregar dados: ${getResponse.statusText}`);
                    globalDadosCartao = await getResponse.json();
                } else { // GET
                    globalDadosCartao = await response.json();
                }
            }


            // Bloco de Renderização (executa se globalDadosCartao estiver populado)
            if (globalDadosCartao) {
                // 1. Renderizar Info do Cartão
                if (elCartaoDetalhes) {
                    elCartaoDetalhes.innerHTML = `
                        <div class="cartao-visual" style="background: ${globalDadosCartao.corFundo}; color: ${globalDadosCartao.corTexto};">
                            <div class="cartao-visual-header"><img src="${globalDadosCartao.logoImg}" class="cartao-logo-visual" alt="Logo"><img src="${globalDadosCartao.bandeiraImg}" class="cartao-bandeira-visual" alt="Bandeira"></div>
                            <div class="cartao-visual-numero">${globalDadosCartao.numeroMascarado}</div>
                            <div class="cartao-visual-footer"><span class="cartao-nome-completo-visual">${globalDadosCartao.nomeCompleto.split(' ')[0].toUpperCase()}</span><span class="cartao-validade-visual">VALIDADE ${globalDadosCartao.validade}</span></div>
                        </div>
                        <div class="cartao-info"><h1>${globalDadosCartao.nomeCompleto}</h1><p>Número: <span class="numero">${globalDadosCartao.numeroMascarado}</span></p><p>Validade: ${globalDadosCartao.validade}</p></div>`;
                }

                // 2. Renderizar Resumo Financeiro
                if(elTotalDespesas) elTotalDespesas.textContent = (parseFloat(globalDadosCartao.totalDespesas) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                if(elTotalAssinaturas) elTotalAssinaturas.textContent = (parseFloat(globalDadosCartao.totalAssinaturas) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                if(elTotalParcelas) elTotalParcelas.textContent = (parseFloat(globalDadosCartao.totalParcelas) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                if(elTotalGeral) elTotalGeral.textContent = (parseFloat(globalDadosCartao.totalGeral) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

                // 3. Renderizar Listas de Itens
                const listasConfig = [
                    { tipo: 'despesa', elementoDOM: elListaDespesas },
                    { tipo: 'assinatura', elementoDOM: elListaAssinaturas },
                    { tipo: 'parcela', elementoDOM: elListaParcelas }
                ];

                listasConfig.forEach(config => {
                    if (!config.elementoDOM || !globalDadosCartao.itens) {
                        if(config.elementoDOM) config.elementoDOM.innerHTML = `<p class="mensagem-vazio">Erro ao carregar.</p>`;
                        return;
                    }
                    const itensFiltrados = globalDadosCartao.itens.filter(item => item.tipo === config.tipo);
                    if (itensFiltrados.length === 0) {
                        config.elementoDOM.innerHTML = `<p class="mensagem-vazio">Nenhum item em ${config.tipo}.</p>`;
                    } else {
                        config.elementoDOM.innerHTML = itensFiltrados.map(item => {
                            let detalhes = '';
                            let dataFormatada = 'N/A';
                            if (item.tipo === 'despesa' && item.data) dataFormatada = item.data.split('T')[0].split('-').reverse().join('/');
                            else if (item.tipo === 'assinatura' && item.dataInicio) dataFormatada = item.dataInicio.split('T')[0].split('-').reverse().join('/');
                            else if (item.tipo === 'parcela' && item.dataCompra) dataFormatada = item.dataCompra.split('T')[0].split('-').reverse().join('/');

                            if (item.tipo === 'despesa') detalhes = `Data: ${dataFormatada}`;
                            else if (item.tipo === 'assinatura') detalhes = `Início: ${dataFormatada}`;
                            else if (item.tipo === 'parcela') detalhes = `Compra: ${dataFormatada} - ${item.atual||'?'}/${item.total||'?'}`;
                            
                            const valorFmt = item.tipo === 'assinatura' ? `${(parseFloat(item.valor) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês` : (parseFloat(item.valor) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                            return `
                                <div class="item">
                                    <div class="item-info"><p class="descricao">${item.descricao}</p><p class="detalhes">${detalhes}</p></div>
                                    <p class="item-valor">${valorFmt}</p>
                                    <div class="item-acoes"><button title="Excluir Item" data-item-id="${item.id}" class="btn-excluir-item">&#128465;</button></div>
                                </div>`;
                        }).join('');
                    }
                });
                // Mostra seções que podem ter sido escondidas
                document.querySelector('.resumo-financeiro')?.style.removeProperty('display');
                document.querySelector('.abas-container')?.style.removeProperty('display');
            }

        } catch (error) {
            console.error(`Erro na ação '${acao}':`, error);
            if(elCartaoDetalhes) elCartaoDetalhes.innerHTML = `<p class="placeholder-mensagem erro">Falha na operação: ${error.message}</p>`;
            if (acao === 'carregar' || acao === 'inicializar') { // Esconde seções se o carregamento inicial falhar
                document.querySelector('.resumo-financeiro')?.style.setProperty('display', 'none', 'important');
                document.querySelector('.abas-container')?.style.setProperty('display', 'none', 'important');
            }
        }
    }
    let globalDadosCartao = null; // Para armazenar os dados do cartão e evitar re-passar

    // Configuração de Eventos
    document.getElementById('btn-adicionar-despesa')?.addEventListener('click', () => gerenciarCartao('adicionarItem', 'despesa'));
    document.getElementById('btn-adicionar-assinatura')?.addEventListener('click', () => gerenciarCartao('adicionarItem', 'assinatura'));
    document.getElementById('btn-adicionar-parcela')?.addEventListener('click', () => gerenciarCartao('adicionarItem', 'parcela'));

    document.querySelectorAll('.abas .aba').forEach(botaoAba => {
        botaoAba.addEventListener('click', (event) => {
            document.querySelectorAll('.abas .aba').forEach(b => b.classList.remove('ativa'));
            document.querySelectorAll('.conteudo-abas .conteudo-aba').forEach(c => c.classList.remove('ativa'));
            event.currentTarget.classList.add('ativa');
            document.getElementById(`conteudo-${event.currentTarget.dataset.aba}`)?.classList.add('ativa');
        });
    });

    document.querySelector('.conteudo-abas')?.addEventListener('click', (event) => {
        const btnExcluir = event.target.closest('.btn-excluir-item');
        if (btnExcluir && btnExcluir.dataset.itemId) {
            gerenciarCartao('removerItem', btnExcluir.dataset.itemId);
        }
    });

    // Inicialização
    const params = new URLSearchParams(window.location.search);
    idCartaoAtual = params.get('cartao');
    if (idCartaoAtual) {
        gerenciarCartao('carregar'); // Ação inicial é carregar os dados
    } else {
        if(elCartaoDetalhes) elCartaoDetalhes.innerHTML = `<p class="placeholder-mensagem erro">ID do cartão não especificado. Use <code>?cartao=SEU_ID</code></p>`;
        document.querySelector('.resumo-financeiro')?.style.setProperty('display', 'none', 'important');
        document.querySelector('.abas-container')?.style.setProperty('display', 'none', 'important');
    }
});