const apiURL = 'https://690bdd796ad3beba00f664bd.mockapi.io/agendamentos';

// Notificações (Toasts)
function mostrarNotificacao(mensagem) {
  $('#toast-body-message').text(mensagem);
  const toastElement = $('#notificacaoToast');
  const toast = new bootstrap.Toast(toastElement);
    toast.show();
}

$(document).ready(function() {
  
    // ===Habilita o botão 'Limpar' ao digitar ===
    $('#form-agendamento input, #form-agendamento select').on('input change', function() {
        $('#btn-limpar').prop('disabled', false);
    });


    // === Carregar agendamentos ===
  function carregarAgendamentos() {
    $.ajax({
        url: apiURL,
        method: 'GET',
        success: function(data) {
          $('#lista-agendamentos').empty();
          
          // Ordena os agendamentos por data (do mais recente para o mais antigo)
          data.sort((a, b) => new Date(a.data) - new Date(b.data));

          data.forEach(a => {
            // Formata a data para DD/MM/YYYY
            const dataFormatada = new Date(a.data).toLocaleDateString('pt-BR', {
              timeZone: 'UTC' // Importante para evitar problemas de fuso
            });

            $('#lista-agendamentos').append(`
            <tr id="tr-agendamento-${a.id}">
                <td>${dataFormatada}</td>
                <td>${a.hora}</td>
                <td>${a.nome}</td>
                <td>${a.servico}</td>
                <td class="text-center">
                <i class="edit bi bi-pencil-square text-primary me-2" style="cursor:pointer;" data-id="${a.id}"></i>
                <i class="delete bi bi-trash text-danger" style="cursor:pointer;" data-id="${a.id}"></i>
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

    const agendamento = {
      nome: $('#nome').val(),
      hora: $('#hora').val(),
      servico: $('#servico').val(),
      data: $('#data').val()
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
        $('#idAgendamento').val(''); // Limpa o ID
        $('#btn-limpar').prop('disabled', true);        }
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
          $('#btn-limpar').prop('disabled', true);        }
      });
    }
  });

  // === Editar ===
  $(document).on('click', '.edit', function() {
    
    const id = $(this).data('id');

    $.ajax({
      url: `${apiURL}/${id}`,
      method: 'GET',
      success: function(a) {
        $('#idAgendamento').val(a.id);
        $('#nome').val(a.nome);
        $('#hora').val(a.hora);
        $('#servico').val(a.servico);
        const dataFormatada = new Date(a.data).toISOString().split('T')[0];
        $('#data').val(dataFormatada);
        $('#btn-limpar').prop('disabled', false);
        $('tr').css("background-color", "#FFF");      
        $(`#tr-agendamento-${a.id}`).css("background-color", "#c9c9c9");
        }
    });
  });

  // === Excluir ===
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
    $('#idAgendamento').val('');
    $(this).prop('disabled', true); 
  });

});
