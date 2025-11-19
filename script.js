/* script.js (Versão com Verificação de Disponibilidade) */

const apiURL = 'https://690bdd796ad3beba00f664bd.mockapi.io/agendamentos';

// Notificações (Toasts)
function mostrarNotificacao(mensagem) {
  $('#toast-body-message').text(mensagem);
  const toastElement = $('#notificacaoToast');
  const toast = new bootstrap.Toast(toastElement);
    toast.show();
}

// === NOVA FUNÇÃO: Resetar o campo de horários ===
function resetarHorarios(mensagem = 'Selecione uma data primeiro') {
    // Limpa feedback, reabilita o select
    $('#horario-feedback').text('');
    $('#hora').prop('disabled', false).val('');
    
    // Reseta todas as <option> para o estado original
    $('#hora option').each(function() {
        const valor = $(this).val();
        if (valor) { // Ignora o "Selecione..."
            $(this).text(valor).prop('disabled', false);
        } else {
            $(this).text(mensagem); // Define a mensagem padrão
        }
    });
}

// === NOVA FUNÇÃO: Atualizar horários disponíveis ===
function atualizarHorariosDisponiveis(dataSelecionada, horarioSelecionado) {
    const idEmEdicao = $('#idAgendamento').val();
    
    $('#loading-horarios').show();
    $('#horario-feedback').text('Verificando horários...');
    $('#hora').prop('disabled', true);

    $.ajax({
      
        url: `${apiURL}?data=${dataSelecionada}&status=confirmado`,
        method: 'GET',
        success: function(agendamentosDoDia) {
            
            resetarHorarios('Selecione um horário');

            $('#hora').val(horarioSelecionado);
            // --- LÓGICA DE HORÁRIO PASSADO (INÍCIO) ---
            const agora = new Date();
            const dataMinima = agora.toISOString().split('T')[0]; // Padrão YYYY-MM-DD
            const horaAtual = agora.getHours(); // Apenas a hora (0-23)
            
            // Verifica se a data selecionada é o dia de hoje
            const ehHoje = (dataSelecionada === dataMinima);
            // --- LÓGICA DE HORÁRIO PASSADO (FIM) ---

            const horariosReservados = agendamentosDoDia
                .filter(a => a.id !== idEmEdicao)
                .map(a => a.hora);
            
            $('#hora option').each(function() {
                const valor = $(this).val();
                if (!valor) return; // Pula o "Selecione..."

                const isReserved = horariosReservados.includes(valor);
                
                // === NOVO: Verifica se o horário já passou ===
                let isPastTime = false;
                if (ehHoje) {
                    // Pega a hora da opção (ex: "09:00" -> 9)
                    const horaDaOpcao = parseInt(valor.split(':')[0]);
                    
                    if (horaDaOpcao <= horaAtual) {
                        isPastTime = true;
                    }
                }
                // ============================================

                // Atualiza a lógica de desabilitar
                if (isReserved) {
                    $(this).prop('disabled', true);
                    $(this).text(valor + ' - Reservado');
                } else if (isPastTime) {
                    $(this).prop('disabled', true);
                    $(this).text(valor + ' - Expirado');
                }
            });
            
            const totalOpcoes = $('#hora option[value!=""]').length;
            const totalDesabilitadas = $('#hora option:disabled').length;

            if (totalOpcoes === totalDesabilitadas) {
                 $('#horario-feedback').text('Todos os horários ocupados/expirados para este dia.');
            } else {
                 $('#horario-feedback').text('');
            }

        },
        // Caso não encontre agendamento com a data, reseta os horários para o default
        statusCode:{404: function() {
          resetarHorarios('Selecione um horário');
      }},
        error: function() {
            $('#horario-feedback').text('Erro ao verificar horários.');
        },
        complete: function() {
            $('#loading-horarios').hide();
            $('#hora').prop('disabled', false);
        }
    });
}

$(document).ready(function() {

    // === ANIMAÇÃO DO HEADER ===
    setTimeout(function() {
        $('header').addClass('header-pequeno');
        $('body').removeClass('loading');
    }, 1000);

    
    // === BLOQUEAR DATAS PASSADAS ===
    const today = new Date(); 
    const ano = today.getFullYear();
    const mes = String(today.getMonth() + 1).padStart(2, '0'); 
    const dia = String(today.getDate()).padStart(2, '0');
    const dataMinima = `${ano}-${mes}-${dia}`;
    // Define o atributo 'min' no input de data
    $('#data').attr('min', dataMinima);
  

    // Habilita o botão 'Limpar' ao digitar
    $('#form-agendamento input, #form-agendamento select').on('input change', function() {
        $('#btn-limpar').prop('disabled', false);
    });

    // === GATILHO NOVO: Ao mudar a data ===
    $('#data').on('change', function() {
        const data = $(this).val();
        if (data) {
            // Chama a nova função de verificação
            atualizarHorariosDisponiveis(data, null);
        } else {
            // Se a data for limpa, reseta os horários
            resetarHorarios();
        }
    });

    // === Carregar agendamentos (Função principal da lista) ===
    function carregarAgendamentos() {
      // (O código desta função continua o mesmo de antes)
      $.ajax({
        url: apiURL,
        method: 'GET',
        success: function(data) {
          $('#lista-agendamentos').empty();
          
          data.sort((a, b) => new Date(b.data) - new Date(a.data));

          data.forEach(a => {
            const dataFormatada = new Date(a.data).toLocaleDateString('pt-BR', {
              timeZone: 'UTC'
            });

            $('#lista-agendamentos').append(`
            <tr id="tr-agendamento-${a.id}">
                <td>${dataFormatada}</td>
                <td>${a.hora}</td>
                <td>${a.nome}</td>
                <td>${a.servico}</td>
                <td class="text-center">
                <i class="edit bi bi-pencil-square" id="icon-pencil" data-id="${a.id}"></i>
                <i class="delete bi bi-trash" id="icon-trash" data-id="${a.id}"></i>
                </td>
            </tr>
            `);
          });
        }
      });
    }

    carregarAgendamentos();

    // === Criar ou editar agendamento ===
    $('#form-agendamento').submit(function(e) {
      e.preventDefault();

      // === NOVA VALIDAÇÃO ===
      // Verifica se o horário selecionado está desabilitado
      if ($('#hora option:selected').is(':disabled')) {
          mostrarNotificacao('Por favor, selecione um horário válido.');
          return; 
      }

      const agendamento = {
        nome: $('#nome').val(),
        hora: $('#hora').val(),
        servico: $('#servico').val(),
        data: $('#data').val(),
        status: 'confirmado' // Status adicionado
      };

      const id = $('#idAgendamento').val();

      if (id) {
        // PUT - Atualizar
        $.ajax({
          url: `${apiURL}/${id}`,
          method: 'PUT',
          data: agendamento,
          success: function() {
            mostrarNotificacao('Agendamento atualizado com sucesso!');
            carregarAgendamentos();
            $('#form-agendamento')[0].reset();
            $('#idAgendamento').val(''); 
            $('#btn-limpar').prop('disabled', true);
            resetarHorarios(); // Reseta os horários
            $('#criar-editar-titulo').text("Criar Agendamento");
          }
        });
      } else {
        // POST - Criar
        $.ajax({
          url: apiURL,
          method: 'POST',
          data: agendamento,
          success: function() {
            mostrarNotificacao('Agendamento criado com sucesso!');
            carregarAgendamentos();
            $('#form-agendamento')[0].reset();
            $('#btn-limpar').prop('disabled', true);
            resetarHorarios(); // Reseta os horários
          }
        });
      }
    });

    // === Editar ===
    $(document).on('click', '.edit', function() {
      const id = $(this).data('id');
      $('#criar-editar-titulo').text("Editar Agendamento");

      $.ajax({
        url: `${apiURL}/${id}`,
        method: 'GET',
        success: function(a) {
          $('tr').css("background-color", "#FFF");      
          $(`#tr-agendamento-${a.id}`).css("background-color", "#e0e1dd");
          $('#idAgendamento').val(a.id);
          $('#nome').val(a.nome);
          const horarioFormatado = a.hora.replace(/[^0-9:]/g, "");
          $(`#hora option[value="${horarioFormatado}"]`).text(horarioFormatado);
          $('#hora').val(horarioFormatado);
          $('#servico').val(a.servico);
          const dataFormatada = new Date(a.data).toISOString().split('T')[0];
          $('#data').val(dataFormatada);
          
          $('#btn-limpar').prop('disabled', false);
          
          // === GATILHO NOVO ===
          // Ao carregar para editar, verifica os horários daquela data
          // para marcar outros horários como "Reservado"
          atualizarHorariosDisponiveis(dataFormatada, horarioFormatado);
        }
      });
    });

    // === Excluir ===
    // (O código desta função continua o mesmo de antes)
    $(document).on('click', '.delete', function() {
      const id = $(this).data('id');
      if (confirm('Tem certeza que deseja excluir este agendamento?')) {
        $.ajax({
          url: `${apiURL}/${id}`,
          method: 'DELETE',
          success: function() {
            mostrarNotificacao('Agendamento excluído com sucesso!');
            carregarAgendamentos();
          }
        });
      }
    });

    // === Limpar formulário ===
    $('#btn-limpar').click(function() {
      // 1. Impede o 'reset' padrão do HTML, que limpa a data
        e.preventDefault(); 
        
        // 2. Limpa os campos manualmente
        $('#idAgendamento').val('');
        $('#nome').val('');
        $('#servico').val('');
        
        // 3. Desabilita o próprio botão
        $(this).prop('disabled', true); 
        
        // 4. Define a data para HOJE e força o 'change'
        // Isso dispara a função 'atualizarHorariosDisponiveis' para hoje
        $('#data').val(dataMinima).trigger('change');
    });

});