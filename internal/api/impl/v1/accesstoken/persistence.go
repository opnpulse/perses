// Copyright 2023 The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package accesstoken

import (
	"crypto/sha256"
	"crypto/subtle"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	databaseModel "github.com/perses/perses/internal/api/database/model"
	"github.com/perses/perses/internal/api/interface/v1/accesstoken"
	"github.com/perses/perses/pkg/model/api"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"golang.org/x/crypto/pbkdf2"
)

var ErrAccessTokenNotExist error = errors.New("access token doesn't exist")

type dao struct {
	accesstoken.DAO
	client databaseModel.DAO
	kind   v1.Kind
}

func NewDAO(persesDAO databaseModel.DAO) accesstoken.DAO {
	return &dao{
		client: persesDAO,
		kind:   v1.KindAccessToken,
	}
}

func (d *dao) Create(entity *v1.AccessToken) error {
	//TODO implement me
	panic("implement me")
}

func (d *dao) Update(entity *v1.AccessToken) error {
	//TODO implement me
	panic("implement me")
}

func (d *dao) Delete(name string) error {
	//TODO implement me
	panic("implement me")
}

func (d *dao) Get(token string) (*v1.AccessToken, error) {
	if token == "" {
		return nil, errors.New("token is empty")
	}
	if len(token) < 8 {
		return nil, ErrAccessTokenNotExist
	}
	rows, err := d.client.GetAccessTokenBySHA(token)
	if err != nil {
		return nil, err
	}

	fmt.Printf("get access token rows = %+v\n", rows)

	// Verify hash
	for _, accessToken := range rows {
		tempHash := hashToken(token, accessToken.TokenSalt)
		if subtle.ConstantTimeCompare([]byte(accessToken.TokenHash), []byte(tempHash)) == 1 &&
			isAccessTokenValid(&accessToken) {
			return &accessToken, nil
		}
	}

	return nil, ErrAccessTokenNotExist
}

func isAccessTokenValid(token *v1.AccessToken) bool {
	return token.ExpDate.IsZero() || token.ExpDate.After(time.Now())
}

func hashToken(token, salt string) string {
	tempHash := pbkdf2.Key([]byte(token), []byte(salt), 10000, 50, sha256.New)
	return fmt.Sprintf("%x", tempHash)
}

func (d *dao) GetByID(id int64) (*v1.AccessToken, error) {
	//TODO implement me
	panic("implement me")
}

func (d *dao) List(q *accesstoken.Query) ([]*v1.AccessToken, error) {
	//TODO implement me
	panic("implement me")
}

func (d *dao) MetadataList(q *accesstoken.Query) ([]api.Entity, error) {
	//TODO implement me
	panic("implement me")
}

func (d *dao) RawMetadataList(q *accesstoken.Query) ([]json.RawMessage, error) {
	//TODO implement me
	panic("implement me")
}

//func (d *dao) Create(entity *v1.Variable) error {
//	return d.client.Create(entity)
//}
//
//func (d *dao) Update(entity *v1.Variable) error {
//	return d.client.Upsert(entity)
//}
//
//func (d *dao) Delete(project string, name string) error {
//	return d.client.Delete(d.kind, v1.NewProjectMetadata(project, name))
//}
//
//func (d *dao) DeleteAll(project string) error {
//	return d.client.DeleteByQuery(&variable.Query{Project: project})
//}
//
//func (d *dao) Get(project string, name string) (*v1.Variable, error) {
//	entity := &v1.Variable{}
//	return entity, d.client.Get(d.kind, v1.NewProjectMetadata(project, name), entity)
//}
//
//func (d *dao) List(q *variable.Query) ([]*v1.Variable, error) {
//	var result []*v1.Variable
//	err := d.client.Query(q, &result)
//	return result, err
//}
//
//func (d *dao) RawList(q *variable.Query) ([]json.RawMessage, error) {
//	return d.client.RawQuery(q)
//}
//
//func (d *dao) MetadataList(q *variable.Query) ([]api.Entity, error) {
//	var list []*v1.PartialProjectEntity
//	err := d.client.Query(q, &list)
//	result := make([]api.Entity, 0, len(list))
//	for _, el := range list {
//		result = append(result, el)
//	}
//	return result, err
//}
//
//func (d *dao) RawMetadataList(q *variable.Query) ([]json.RawMessage, error) {
//	return d.client.RawMetadataQuery(q, d.kind)
//}
